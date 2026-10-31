// ==============================================================================
// NEXA - Secure Locker File Operations & Metadata CRUD Test Suite
// Verifies all 9 required file operations, storage synchronization, and security
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Isolate from external network calls
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
  getSupabaseConfigStatus: () => ({ configured: false, message: 'Isolated Test Mock' }),
}));

import { lockerService, safeStorage, safeSessionStorage } from '../services/lockerService';

describe('NEXA Secure Locker - File Operations & Metadata CRUD', () => {
  const userAlice = 'user-alice-crud-000000000001';
  const userBob = 'user-bob-crud-000000000002';
  const alicePassphrase = 'AliceStrongPassword#2026!';
  const bobPassphrase = 'BobStrongPassword#2026!';

  beforeEach(async () => {
    await lockerService.lockVault(userAlice);
    await lockerService.lockVault(userBob);
    safeStorage.clear();
    safeSessionStorage.clear();
  });

  it('1 & 2. Uploads a new file and verifies complete cryptographic metadata', async () => {
    await lockerService.initializeVault(userAlice, alicePassphrase);

    const pdfContent = '%PDF-1.7 Authentic Classified Report Content\nData: 2026';
    const mockFile = new File([new TextEncoder().encode(pdfContent)], 'tax_return_2026.pdf', {
      type: 'application/pdf',
    });

    const uploadRes = await lockerService.uploadDocument(
      userAlice,
      mockFile,
      '2026 Tax Return',
      'document'
    );

    expect(uploadRes.error).toBeUndefined();
    expect(uploadRes.document).not.toBeNull();

    const doc = uploadRes.document!;
    // 2. Verify metadata
    expect(doc.id).toBeDefined();
    expect(doc.user_id).toBe(userAlice);
    expect(doc.title).toBe('2026 Tax Return');
    expect(doc.filename).toBe('tax_return_2026.pdf');
    expect(doc.mime_type).toBe('application/pdf');
    expect(doc.file_size).toBe(mockFile.size);
    expect(doc.file_path).toBe(`${userAlice}/${doc.id}.enc`);
    expect(doc.encrypted_dek).toBeDefined();
    expect(doc.dek_nonce).toHaveLength(24); // 12 bytes = 24 hex
    expect(doc.data_nonce).toHaveLength(24);
    expect(doc.checksum_sha256).toHaveLength(64); // SHA-256 = 64 hex
    expect(doc.category).toBe('document');
  });

  it('3 & 4. Verifies private storage object exists and document listing shows the file after reload', async () => {
    await lockerService.initializeVault(userAlice, alicePassphrase);

    const mockFile = new File(['%PDF-1.4 Secret Attachment'], 'passport.pdf', {
      type: 'application/pdf',
    });
    const uploadRes = await lockerService.uploadDocument(userAlice, mockFile, 'Passport', 'identity');
    const doc = uploadRes.document!;

    // 3. Verify private storage object exists in session memory
    const storedHex = safeSessionStorage.getItem(`nexa_enc_file_${doc.file_path}`);
    expect(storedHex).not.toBeNull();
    expect(storedHex!.length).toBeGreaterThan(0);

    // 4. Reload the Locker and confirm the file appears
    const listedDocs = await lockerService.listDocuments(userAlice);
    expect(listedDocs.length).toBe(1);
    expect(listedDocs[0].id).toBe(doc.id);
    expect(listedDocs[0].title).toBe('Passport');
    expect(listedDocs[0].category).toBe('identity');
  });

  it('5, 6 & 7. Deletes file and confirms both Storage object and Database metadata are removed', async () => {
    await lockerService.initializeVault(userAlice, alicePassphrase);

    const mockFile = new File(['%PDF-1.4 Temp Contract'], 'temp_contract.pdf', {
      type: 'application/pdf',
    });
    const uploadRes = await lockerService.uploadDocument(userAlice, mockFile, 'Contract', 'document');
    const doc = uploadRes.document!;

    // Verify initially present
    expect(safeSessionStorage.getItem(`nexa_enc_file_${doc.file_path}`)).not.toBeNull();
    let docs = await lockerService.listDocuments(userAlice);
    expect(docs.length).toBe(1);

    // 5. Delete the uploaded file
    const deleteRes = await lockerService.deleteDocument(userAlice, doc.id);
    expect(deleteRes.success).toBe(true);

    // 6. Confirm Storage object is removed
    expect(safeSessionStorage.getItem(`nexa_enc_file_${doc.file_path}`)).toBeNull();

    // 7. Confirm Database metadata is removed
    docs = await lockerService.listDocuments(userAlice);
    expect(docs.length).toBe(0);
  });

  it('8. Verifies one user cannot access another user files', async () => {
    // Alice uploads a file
    await lockerService.initializeVault(userAlice, alicePassphrase);
    const mockFile = new File(['%PDF-1.4 Alice Private File'], 'alice_private.pdf', {
      type: 'application/pdf',
    });
    const uploadRes = await lockerService.uploadDocument(userAlice, mockFile, 'Alice Secret', 'document');
    const aliceDoc = uploadRes.document!;

    // Alice locks vault
    await lockerService.lockVault(userAlice);

    // Bob logs in and unlocks his vault
    await lockerService.initializeVault(userBob, bobPassphrase);

    // Bob lists documents -> Bob sees 0 documents (isolated from Alice)
    const bobDocs = await lockerService.listDocuments(userBob);
    expect(bobDocs).toEqual([]);

    // Bob attempts to directly download & decrypt Alice's document -> fails cryptographically
    await expect(
      lockerService.downloadAndDecryptDocument(userBob, aliceDoc)
    ).rejects.toThrow();
  });

  it('9. Verifies locked Locker sessions cannot perform private file operations', async () => {
    await lockerService.initializeVault(userAlice, alicePassphrase);

    const mockFile = new File(['%PDF-1.4 Some File'], 'some_file.pdf', { type: 'application/pdf' });
    const uploadRes = await lockerService.uploadDocument(userAlice, mockFile, 'Some File', 'document');
    const doc = uploadRes.document!;

    // Lock the session
    await lockerService.lockVault(userAlice);
    expect(lockerService.isVaultUnlocked()).toBe(false);

    // Listing blocked
    const docs = await lockerService.listDocuments(userAlice);
    expect(docs).toEqual([]);

    // Upload blocked
    const blockedUpload = await lockerService.uploadDocument(userAlice, mockFile, 'New File', 'document');
    expect(blockedUpload.document).toBeNull();
    expect(blockedUpload.error).toContain('Locker is locked');

    // Download/decrypt blocked
    await expect(
      lockerService.downloadAndDecryptDocument(userAlice, doc)
    ).rejects.toThrow('Locker is locked');

    // Deletion blocked
    const blockedDelete = await lockerService.deleteDocument(userAlice, doc.id);
    expect(blockedDelete.success).toBe(false);
    expect(blockedDelete.error).toContain('Locker is locked');
  });
});
