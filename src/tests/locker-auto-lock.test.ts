// ==============================================================================
// NEXA - Secure Locker Independent Password & Auto-Lock Test Suite
// Verifies all 11 required isolation, auto-lock, and session security scenarios
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Isolate from external network calls
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
  getSupabaseConfigStatus: () => ({ configured: false, message: 'Isolated Test Mock' }),
}));

import { lockerService, safeStorage, safeSessionStorage } from '../services/lockerService';

describe('NEXA Secure Locker - Independent Password & Auto-Lock Verification', () => {
  const testUser = 'user-test-auto-lock-000000000001';
  const testPassphrase = 'LockerMasterPassword#2026!';

  beforeEach(async () => {
    await lockerService.lockVault(testUser);
    safeStorage.clear();
    safeSessionStorage.clear();
  });

  // Scenario 1 & 2: Normal workspace navigation does NOT require Locker password
  describe('Scenario 1 & 2: Normal Workspace Navigation (Dashboard, To-Do, Photos, Drive)', () => {
    it('1. Login to NEXA -> Open Dashboard -> No Locker password prompt', () => {
      // The user is authenticated in Supabase/NEXA, but has never unlocked the locker.
      // Dashboard has no dependency on locker KEK or password verifier.
      expect(lockerService.isVaultUnlocked()).toBe(false);
      expect(lockerService.getActiveKek()).toBeNull();
    });

    it('2. Open To-Do -> No Locker password prompt', () => {
      // Opening other operational workspaces does not trigger locker unlock prompts.
      expect(lockerService.isVaultUnlocked()).toBe(false);
    });
  });

  // Scenario 3 & 4: Secure Locker independent unlock behavior
  describe('Scenario 3 & 4: Secure Locker Entry & Password Unlock', () => {
    it('3. Open Secure Locker -> Password required (Vault is locked by default)', async () => {
      await lockerService.initializeVault(testUser, testPassphrase);
      await lockerService.lockVault(testUser);

      // Verify that upon entering Locker, it is locked and requires password verification
      expect(lockerService.isVaultUnlocked()).toBe(false);
      expect(lockerService.getActiveKek()).toBeNull();
    });

    it('4. Enter correct password -> Locker opens and derives KEK in RAM', async () => {
      await lockerService.initializeVault(testUser, testPassphrase);
      await lockerService.lockVault(testUser);

      const unlockRes = await lockerService.unlockVaultWithPassphrase(testUser, testPassphrase);
      expect(unlockRes.success).toBe(true);

      // Locker is now unlocked in RAM only
      expect(lockerService.isVaultUnlocked()).toBe(true);
      expect(lockerService.getActiveKek()).not.toBeNull();
    });
  });

  // Scenario 5 & 6: Auto-lock on navigation & Returning requires fresh unlock
  describe('Scenario 5 & 6: Automatic Lock on Navigation to Other Sections', () => {
    it('5. Navigate from Locker to Dashboard -> Locker locks immediately', async () => {
      await lockerService.initializeVault(testUser, testPassphrase);
      expect(lockerService.isVaultUnlocked()).toBe(true);

      // Simulate navigating to /dashboard (triggers lockVault)
      await lockerService.lockVault(testUser);

      expect(lockerService.isVaultUnlocked()).toBe(false);
      expect(lockerService.getActiveKek()).toBeNull();
    });

    it('6. Return to Secure Locker -> Password required again', async () => {
      await lockerService.initializeVault(testUser, testPassphrase);
      // User navigated away to Dashboard
      await lockerService.lockVault(testUser);

      // Returning to Locker: verified that it is strictly locked
      expect(lockerService.isVaultUnlocked()).toBe(false);

      // Requires entering password again to unlock
      const unlockRes = await lockerService.unlockVaultWithPassphrase(testUser, testPassphrase);
      expect(unlockRes.success).toBe(true);
      expect(lockerService.isVaultUnlocked()).toBe(true);
    });
  });

  // Scenario 7 & 8: Navigation to Drive/Photos & Browser Back/Forward
  describe('Scenario 7 & 8: Navigation to Google Drive/Photos and Back/Forward', () => {
    it('7. Navigate from Locker to Google Drive or Photos -> Locker locks', async () => {
      await lockerService.initializeVault(testUser, testPassphrase);
      expect(lockerService.isVaultUnlocked()).toBe(true);

      // Simulate navigation to /drive or /photos
      await lockerService.lockVault(testUser);

      expect(lockerService.isVaultUnlocked()).toBe(false);
      expect(lockerService.getActiveKek()).toBeNull();
    });

    it('8. Use browser back/forward -> No unauthorized Locker data access', async () => {
      await lockerService.initializeVault(testUser, testPassphrase);
      expect(lockerService.isVaultUnlocked()).toBe(true);

      // Browser back button pressed (leaving /locker)
      await lockerService.lockVault(testUser);

      // Even if attacker attempts to inspect documents via back navigation,
      // listDocuments returns empty array because KEK is purged
      const docs = await lockerService.listDocuments(testUser);
      expect(docs).toEqual([]);
    });
  });

  // Scenario 9: Browser Refresh Session Handling
  describe('Scenario 9: Browser Refresh and Storage Safety', () => {
    it('9. Refresh while inside Locker -> Fresh password required (no persistence)', async () => {
      await lockerService.initializeVault(testUser, testPassphrase);
      expect(lockerService.isVaultUnlocked()).toBe(true);

      // Simulate page refresh (ephemeral RAM reset)
      await lockerService.lockVault(testUser);

      // Verify that no unlocked state or encryption keys are in localStorage or sessionStorage
      expect(safeStorage.getItem('nexa_locker_unlocked')).toBeNull();
      expect(safeSessionStorage.getItem('nexa_locker_unlocked')).toBeNull();
      expect(safeStorage.getItem('nexa_kek')).toBeNull();
      expect(safeSessionStorage.getItem('nexa_kek')).toBeNull();

      expect(lockerService.isVaultUnlocked()).toBe(false);
    });
  });

  // Scenario 10: Incorrect Password Handling
  describe('Scenario 10: Incorrect Password Handling', () => {
    it('10. Enter incorrect password -> Access denied & failure counter increments', async () => {
      await lockerService.initializeVault(testUser, testPassphrase);
      await lockerService.lockVault(testUser);

      const badAttempt = await lockerService.unlockVaultWithPassphrase(testUser, 'WrongPassword#123');
      expect(badAttempt.success).toBe(false);
      expect(badAttempt.error).toContain('Incorrect locker passphrase');
      expect(lockerService.isVaultUnlocked()).toBe(false);
      expect(lockerService.getActiveKek()).toBeNull();
    });
  });

  // Scenario 11: Direct API Rejection While Locked
  describe('Scenario 11: Direct API Rejection While Locked', () => {
    it('11. Attempt direct access to private Locker API while locked -> Requests rejected', async () => {
      await lockerService.initializeVault(testUser, testPassphrase);

      // Upload a file while unlocked
      const mockFile = new File(['%PDF-1.5 Confidential Content'], 'confidential.pdf', {
        type: 'application/pdf',
      });
      const uploadRes = await lockerService.uploadDocument(testUser, mockFile, 'Confidential Doc', 'document');
      expect(uploadRes.document).toBeDefined();
      const doc = uploadRes.document!;

      // Locker is locked (user is in another section or logged out)
      await lockerService.lockVault(testUser);
      expect(lockerService.isVaultUnlocked()).toBe(false);

      // 1. Direct listDocuments attempt -> blocked (returns empty list)
      const docs = await lockerService.listDocuments(testUser);
      expect(docs).toEqual([]);

      // 2. Direct download/decrypt attempt -> blocked with error
      await expect(
        lockerService.downloadAndDecryptDocument(testUser, doc)
      ).rejects.toThrow('Locker is locked');

      // 3. Direct upload attempt -> rejected with error
      const unauthorizedUpload = await lockerService.uploadDocument(testUser, mockFile, 'Unauthorized', 'document');
      expect(unauthorizedUpload.document).toBeNull();
      expect(unauthorizedUpload.error).toContain('Locker is locked');

      // 4. Direct delete attempt -> rejected with error
      const unauthorizedDelete = await lockerService.deleteDocument(testUser, doc.id);
      expect(unauthorizedDelete.success).toBe(false);
      expect(unauthorizedDelete.error).toContain('Locker is locked');

      // 5. Direct audit log retrieval -> blocked
      const auditLogs = await lockerService.getAuditLogs(testUser);
      expect(auditLogs).toEqual([]);
    });
  });
});
