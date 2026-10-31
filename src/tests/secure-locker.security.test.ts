// ==============================================================================
// NEXA Enterprise Productivity Workspace - Secure Locker Zero-Trust Security Suite
// Comprehensive Automated Security Verification Tests
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Isolate security tests from external network dependencies
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
  getSupabaseConfigStatus: () => ({ configured: false, message: 'Isolated Security Test Mock' }),
}));

import {
  evaluatePassphraseStrength,
  deriveKeyEncryptionKey,
  generateDataEncryptionKey,
  wrapDekWithKek,
  unwrapDekWithKek,
  encryptDataWithDek,
  decryptDataWithDek,
  generateNonce,
  generateSalt,
  validateFileSignatureAndSize,
  bytesToHex,
  CRYPTO_CONSTANTS,
} from '../services/crypto/lockerCrypto';
import { lockerService, safeStorage, safeSessionStorage } from '../services/lockerService';

describe('NEXA Secure Locker - Zero-Trust Security Test Suite', () => {
  const userAlice = 'user-alice-0000-0000-0000-000000000001';
  const userBob = 'user-bob-0000-0000-0000-000000000002';
  const alicePassphrase = 'AliceStrongLocker#2026!SecureKey';
  const bobPassphrase = 'BobStrongLocker#2026!SecureKey';

  beforeEach(async () => {
    // Clear demo storage and lock vaults
    await lockerService.lockVault(userAlice);
    await lockerService.lockVault(userBob);
    safeStorage.clear();
    safeSessionStorage.clear();
  });

  // 1. Unauthorized API Access & Initialization
  describe('1. Identity & Unauthorized API Access', () => {
    it('rejects document upload or download operations when locker is locked', async () => {
      const mockFile = new File(['%PDF-1.5 test document content'], 'secret.pdf', {
        type: 'application/pdf',
      });

      // Attempt upload while locked
      const uploadResult = await lockerService.uploadDocument(userAlice, mockFile, 'My Secret', 'document');
      expect(uploadResult.document).toBeNull();
      expect(uploadResult.error).toContain('Locker is locked');

      // Attempt download while locked
      await expect(
        lockerService.downloadAndDecryptDocument(userAlice, {
          id: 'unauthorized-doc',
          user_id: userAlice,
          title: 'Fake',
          filename: 'fake.pdf',
          mime_type: 'application/pdf',
          file_size: 100,
          file_path: `${userAlice}/fake.pdf.enc`,
          encrypted_dek: 'fake',
          dek_nonce: 'fake',
          data_nonce: 'fake',
          checksum_sha256: 'fake',
          category: 'document',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      ).rejects.toThrow('Locker is locked');
    });

    it('requires authenticated user identity and validates inputs', async () => {
      const vaultRecord = await lockerService.getVaultRecord('');
      expect(vaultRecord).toBeNull();
    });
  });

  // 2. Cross-User Access Attempts & Isolation
  describe('2. Cross-User Access Isolation', () => {
    it('prevents User Bob from decrypting User Alice documents even if Bob possesses ciphertext', async () => {
      // Alice initializes vault and uploads a document
      const aliceSetup = await lockerService.initializeVault(userAlice, alicePassphrase);
      expect(aliceSetup.recoveryKey).toBeDefined();

      const secretPayload = 'Alice Top Secret Medical Records 2026';
      const fileBytes = new TextEncoder().encode(secretPayload);
      const aliceFile = new File([fileBytes], 'medical.txt', { type: 'text/plain' });

      const uploadResult = await lockerService.uploadDocument(userAlice, aliceFile, 'Medical Records', 'document');
      expect(uploadResult.document).toBeDefined();
      const aliceDoc = uploadResult.document!;

      // Lock Alice's vault
      await lockerService.lockVault(userAlice);

      // Bob logs in and unlocks his own vault
      await lockerService.initializeVault(userBob, bobPassphrase);
      expect(lockerService.isVaultUnlocked()).toBe(true);

      // Bob attempts to download and decrypt Alice's document using Bob's unlocked KEK
      // The AAD context and KEK mismatch must cause cryptographic decryption failure
      await expect(
        lockerService.downloadAndDecryptDocument(userAlice, aliceDoc)
      ).rejects.toThrow();
    }, 20000);

    it('ensures separate salts and isolated cryptographic keys per user', async () => {
      const saltA = generateSalt();
      const saltB = generateSalt();

      const kekA = await deriveKeyEncryptionKey('SamePassphrase#2026!SecureKey', saltA);
      const kekB = await deriveKeyEncryptionKey('SamePassphrase#2026!SecureKey', saltB);

      const dek = await generateDataEncryptionKey();
      const aad = `${userAlice}:doc-1:dek`;

      const wrappedUnderA = await wrapDekWithKek(dek, kekA, aad);

      // Attempt to unwrap DEK using kekB must fail
      await expect(
        unwrapDekWithKek(wrappedUnderA.encryptedDekBase64, wrappedUnderA.dekNonceHex, kekB, aad)
      ).rejects.toThrow();
    });
  });

  // 3. Brute-Force Resistance, Rate Limiting & Progressive Delay
  describe('3. Brute-Force Resistance & Lockout Controls', () => {
    it('applies progressive rate limiting and lockout on repeated failed attempts', async () => {
      await lockerService.initializeVault(userAlice, alicePassphrase);
      await lockerService.lockVault(userAlice);

      // Attempt 1: Wrong passphrase
      const attempt1 = await lockerService.unlockVaultWithPassphrase(userAlice, 'WrongPass#1');
      expect(attempt1.success).toBe(false);
      expect(attempt1.remainingAttempts).toBe(4);

      // Attempt 2: Wrong passphrase
      const attempt2 = await lockerService.unlockVaultWithPassphrase(userAlice, 'WrongPass#2');
      expect(attempt2.success).toBe(false);
      expect(attempt2.remainingAttempts).toBe(3);

      // Attempt 3: Triggers short lockout (30 seconds)
      const attempt3 = await lockerService.unlockVaultWithPassphrase(userAlice, 'WrongPass#3');
      expect(attempt3.success).toBe(false);
      expect(attempt3.lockedUntil).toBeDefined();

      // Subsequent attempt while locked out is rejected immediately
      const lockedAttempt = await lockerService.unlockVaultWithPassphrase(userAlice, alicePassphrase);
      expect(lockedAttempt.success).toBe(false);
      expect(lockedAttempt.error).toContain('locked out');
    });

    it('requires high-entropy strong passphrase during setup', () => {
      const weakEvaluations = [
        evaluatePassphraseStrength('12345'),
        evaluatePassphraseStrength('password'),
        evaluatePassphraseStrength('OnlyLowerCaseLongPassphrase'),
        evaluatePassphraseStrength('NO_LOWER_CASE_12345!'),
      ];

      for (const evalResult of weakEvaluations) {
        expect(evalResult.isValid).toBe(false);
      }

      const strongEvaluation = evaluatePassphraseStrength('ValidNexaVault#2026!SuperStrong');
      expect(strongEvaluation.isValid).toBe(true);
      expect(strongEvaluation.score).toBeGreaterThanOrEqual(4);
    });
  });

  // 4. Encryption & Decryption Integrity (Envelope Encryption)
  describe('4. AES-256-GCM Envelope Encryption Integrity', () => {
    it('encrypts and decrypts documents accurately with zero loss', async () => {
      await lockerService.initializeVault(userAlice, alicePassphrase);

      const testContent = '%PDF-1.7 Authentic Classified Report\nParagraph 1: Zero-knowledge compliance.';
      const fileBytes = new TextEncoder().encode(testContent);
      const testFile = new File([fileBytes], 'classified.pdf', { type: 'application/pdf' });

      const uploadResult = await lockerService.uploadDocument(userAlice, testFile, 'Classified Report', 'document');
      expect(uploadResult.document).toBeDefined();

      const downloaded = await lockerService.downloadAndDecryptDocument(userAlice, uploadResult.document!);
      expect(downloaded.filename).toBe('classified.pdf');
      expect(downloaded.mimeType).toBe('application/pdf');

      const arrayBuffer = await downloaded.blob.arrayBuffer();
      const decryptedText = new TextDecoder().decode(arrayBuffer);
      expect(decryptedText).toBe(testContent);
    });

    it('rejects tampered ciphertext immediately via GCM authentication tag verification', async () => {
      const dek = await generateDataEncryptionKey();
      const plainText = new TextEncoder().encode('Integrity critical message');
      const aad = `${userAlice}:tamper-doc:content`;

      const encrypted = await encryptDataWithDek(plainText, dek, aad);
      const tamperedBytes = new Uint8Array(encrypted.encryptedData);

      // Mutate 1 bit in ciphertext
      tamperedBytes[tamperedBytes.length - 1] ^= 0x42;

      await expect(
        decryptDataWithDek(tamperedBytes, dek, encrypted.dataNonceHex, aad)
      ).rejects.toThrow();
    });

    it('rejects tampered Authenticated Additional Data (AAD)', async () => {
      const dek = await generateDataEncryptionKey();
      const plainText = new TextEncoder().encode('Integrity critical message');
      const correctAad = `${userAlice}:tamper-doc:content`;
      const tamperedAad = `${userBob}:tamper-doc:content`;

      const encrypted = await encryptDataWithDek(plainText, dek, correctAad);

      await expect(
        decryptDataWithDek(encrypted.encryptedData, dek, encrypted.dataNonceHex, tamperedAad)
      ).rejects.toThrow();
    });

    it('detects SHA-256 checksum mismatches', async () => {
      const dek = await generateDataEncryptionKey();
      const plainText = new TextEncoder().encode('Checksum test');
      const aad = `${userAlice}:checksum-doc:content`;

      const encrypted = await encryptDataWithDek(plainText, dek, aad);
      const forgedChecksum = '0000000000000000000000000000000000000000000000000000000000000000';

      await expect(
        decryptDataWithDek(
          encrypted.encryptedData,
          dek,
          encrypted.dataNonceHex,
          aad,
          forgedChecksum
        )
      ).rejects.toThrow('Integrity verification failed');
    });
  });

  // 5. Nonce Uniqueness & Cryptographic Constants
  describe('5. Nonce Uniqueness & Standards Compliance', () => {
    it('produces unique 12-byte (96-bit) nonces across 5,000 iterations without collisions', () => {
      const generated = new Set<string>();
      const count = 5000;
      for (let i = 0; i < count; i++) {
        const nonce = generateNonce();
        expect(nonce.byteLength).toBe(CRYPTO_CONSTANTS.GCM_NONCE_LENGTH_BYTES);
        const hex = bytesToHex(nonce);
        expect(generated.has(hex)).toBe(false);
        generated.add(hex);
      }
      expect(generated.size).toBe(count);
    });

    it('enforces 256-bit keys and salts', () => {
      const salt = generateSalt();
      expect(salt.byteLength).toBe(32); // 256 bits
    });
  });

  // 6. File Upload Validation (Magic Bytes & Size)
  describe('6. File Signature & Size Validation', () => {
    it('validates genuine PDF magic header %PDF-', () => {
      const validPdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
      const res = validateFileSignatureAndSize(validPdfHeader, 'application/pdf');
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('application/pdf');
    });

    it('rejects disguised binary executable disguised as text', () => {
      // Binary header containing null byte 0x00
      const executableBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03]); // DOS/MZ header
      const res = validateFileSignatureAndSize(executableBytes, 'text/plain');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('null bytes');
    });

    it('rejects files exceeding 50 MB limit', () => {
      // Mock 51 MB buffer length
      const largeBytes = { byteLength: 53 * 1024 * 1024 } as unknown as Uint8Array;
      const res = validateFileSignatureAndSize(largeBytes, 'application/pdf');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('maximum allowed size');
    });

    it('rejects empty files (0 bytes)', () => {
      const emptyBytes = new Uint8Array(0);
      const res = validateFileSignatureAndSize(emptyBytes, 'application/pdf');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('File is empty');
    });
  });

  // 7. Session Inactivity Lock & Manual Lock
  describe('7. Session Lifecycle & Inactivity Lock', () => {
    it('purges in-memory KEK upon manual lock', async () => {
      await lockerService.initializeVault(userAlice, alicePassphrase);
      expect(lockerService.isVaultUnlocked()).toBe(true);
      expect(lockerService.getActiveKek()).not.toBeNull();

      await lockerService.lockVault(userAlice);
      expect(lockerService.isVaultUnlocked()).toBe(false);
      expect(lockerService.getActiveKek()).toBeNull();
    });

    it('tracks remaining inactivity seconds and activity touch', async () => {
      await lockerService.initializeVault(userAlice, alicePassphrase, 15);
      const remaining = lockerService.getRemainingInactivitySeconds();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(15 * 60);

      lockerService.touchActivity();
      expect(lockerService.getRemainingInactivitySeconds()).toBeCloseTo(15 * 60, -1);
    });
  });

  // 8. Recovery Workflow & Passphrase Change (Key Rotation)
  describe('8. Zero-Knowledge Recovery & Key Rotation', () => {
    it('allows unlocking and recovering vault using 256-bit Recovery Key', async () => {
      const setup = await lockerService.initializeVault(userAlice, alicePassphrase);
      const recoveryKey = setup.recoveryKey;
      expect(recoveryKey).toBeDefined();

      // User locks vault or gets locked out
      await lockerService.lockVault(userAlice);

      // Unlock via Recovery Key
      const recoveryUnlock = await lockerService.unlockVaultWithRecoveryKey(userAlice, recoveryKey);
      expect(recoveryUnlock.success).toBe(true);
      expect(lockerService.isVaultUnlocked()).toBe(true);
    });

    it('rejects invalid or tampered recovery keys', async () => {
      await lockerService.initializeVault(userAlice, alicePassphrase);
      await lockerService.lockVault(userAlice);

      const fakeKey = 'XXXX-YYYY-ZZZZ-AAAA-BBBB-CCCC-DDDD-EEEE';
      const res = await lockerService.unlockVaultWithRecoveryKey(userAlice, fakeKey);
      expect(res.success).toBe(false);
      expect(res.error).toContain('invalid');
    });

    it('rotates KEK and re-wraps DEKs upon passphrase change without destroying document access', async () => {
      await lockerService.initializeVault(userAlice, alicePassphrase);

      // Upload document under original passphrase
      const docContent = 'Sensitive document before key rotation';
      const file = new File([new TextEncoder().encode(docContent)], 'rotation_test.txt', {
        type: 'text/plain',
      });
      const uploadRes = await lockerService.uploadDocument(userAlice, file, 'Rotation Test', 'document');
      expect(uploadRes.document).toBeDefined();

      const newPassphrase = 'AliceBrandNewPassphrase#2026!Updated';

      // Execute passphrase change (re-wraps DEKs with new KEK derived from new passphrase)
      const changeRes = await lockerService.changePassphrase(userAlice, alicePassphrase, newPassphrase);
      expect(changeRes.success).toBe(true);

      // Lock vault
      await lockerService.lockVault(userAlice);

      // Unlock with OLD passphrase must fail
      const oldUnlock = await lockerService.unlockVaultWithPassphrase(userAlice, alicePassphrase);
      expect(oldUnlock.success).toBe(false);

      // Unlock with NEW passphrase must succeed
      const newUnlock = await lockerService.unlockVaultWithPassphrase(userAlice, newPassphrase);
      expect(newUnlock.success).toBe(true);

      // Document must decrypt cleanly under newly wrapped DEK
      const docs = await lockerService.listDocuments(userAlice);
      expect(docs.length).toBe(1);

      const downloaded = await lockerService.downloadAndDecryptDocument(userAlice, docs[0]);
      const decryptedText = new TextDecoder().decode(await downloaded.blob.arrayBuffer());
      expect(decryptedText).toBe(docContent);
    });
  });

  // 9. Security Audit Logging (Append-Only & Redaction)
  describe('9. Security Audit Trail & Redaction', () => {
    it('records security events without sensitive credentials or plaintext secrets', async () => {
      await lockerService.initializeVault(userAlice, alicePassphrase);

      const logs = await lockerService.getAuditLogs(userAlice);
      expect(logs.length).toBeGreaterThan(0);

      // Verify no sensitive keys or passwords leaked into audit logs
      for (const log of logs) {
        expect(log.user_id).toBe(userAlice);
        const serialized = JSON.stringify(log);
        expect(serialized).not.toContain(alicePassphrase);
        expect(serialized).not.toContain('auth_verifier');
        expect(serialized).not.toContain('auth_salt');
        expect(serialized).not.toContain('kek_salt');
      }
    });
  });
});
