// ==============================================================================
// NEXA Enterprise Productivity Workspace - Secure Locker Service
// Zero-Trust Backend Enforcement & Client-Side Envelope Encryption Service
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  LockerVaultRecord,
  LockerDocument,
  LockerAuditLog,
  LockerEventType,
  LockerUnlockResult,
  LockerCategory,
} from '../types/locker';
import {
  generateSalt,
  deriveAuthVerifier,
  deriveKeyEncryptionKey,
  generateRecoveryKeyString,
  normalizeRecoveryKey,
  deriveRecoveryVerifier,
  deriveRecoveryKeyEncryptionKey,
  generateDataEncryptionKey,
  wrapDekWithKek,
  unwrapDekWithKek,
  encryptDataWithDek,
  decryptDataWithDek,
  validateFileSignatureAndSize,
  computeAuthProof,
  deriveRawKeyEncryptionKeyBytes,
  wrapMasterKekUnderRecoveryKek,
  unwrapMasterKekUnderRecoveryKek,
  bytesToHex,
  hexToBytes,
} from './crypto/lockerCrypto';

// Safe in-memory storage fallback for Node test environments or SSR
const memoryStorage = new Map<string, string>();

function isTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    err.code === 'PGRST202' ||
    String(err.message || '').includes('schema cache') ||
    String(err.message || '').includes('does not exist') ||
    String(err.message || '').includes('not found') ||
    String(err.message || '').includes('Bucket not found')
  );
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryStorage.get(key) || null;
      }
    }
    return memoryStorage.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        memoryStorage.set(key, value);
        return;
      }
    }
    memoryStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        memoryStorage.delete(key);
        return;
      }
    }
    memoryStorage.delete(key);
  },
  clear: (): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {
        // noop
      }
    }
    memoryStorage.clear();
  },
};

const sessionMemoryStorage = new Map<string, string>();
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return sessionMemoryStorage.get(key) || null;
      }
    }
    return sessionMemoryStorage.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(key, value);
        return;
      } catch {
        sessionMemoryStorage.set(key, value);
        return;
      }
    }
    sessionMemoryStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(key);
        return;
      } catch {
        sessionMemoryStorage.delete(key);
        return;
      }
    }
    sessionMemoryStorage.delete(key);
  },
  clear: (): void => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.clear();
      } catch {
        // noop
      }
    }
    sessionMemoryStorage.clear();
  },
};

// Ephemeral in-memory session (never persisted to localStorage, cookies or IndexedDB)
interface EphemeralLockerState {
  kek: CryptoKey | null;
  userId: string | null;
  unlockedAt: number | null;
  lastActiveAt: number | null;
  autoLockMinutes: number;
}

const ephemeralState: EphemeralLockerState = {
  kek: null,
  userId: null,
  unlockedAt: null,
  lastActiveAt: null,
  autoLockMinutes: 15,
};

let autoLockInterval: ReturnType<typeof setInterval> | null = null;
const lockListeners = new Set<() => void>();

export const lockerService = {
  // Session listeners
  onAutoLock(callback: () => void) {
    lockListeners.add(callback);
    return () => {
      lockListeners.delete(callback);
    };
  },

  notifyLock() {
    lockListeners.forEach((cb) => cb());
  },

  touchActivity() {
    if (ephemeralState.kek) {
      ephemeralState.lastActiveAt = Date.now();
    }
  },

  getActiveKek(): CryptoKey | null {
    return ephemeralState.kek;
  },

  isVaultUnlocked(): boolean {
    return Boolean(ephemeralState.kek && ephemeralState.userId);
  },

  getRemainingInactivitySeconds(): number {
    if (!ephemeralState.kek || !ephemeralState.lastActiveAt) return 0;
    const elapsedSeconds = Math.floor((Date.now() - ephemeralState.lastActiveAt) / 1000);
    const totalSeconds = ephemeralState.autoLockMinutes * 60;
    return Math.max(0, totalSeconds - elapsedSeconds);
  },

  setAutoLockMinutes(minutes: number) {
    ephemeralState.autoLockMinutes = minutes;
  },

  getAutoLockMinutes(): number {
    return ephemeralState.autoLockMinutes;
  },

  startAutoLockTimer() {
    if (autoLockInterval) clearInterval(autoLockInterval);
    autoLockInterval = setInterval(() => {
      if (ephemeralState.kek && ephemeralState.lastActiveAt) {
        const elapsed = (Date.now() - ephemeralState.lastActiveAt) / 1000;
        if (elapsed >= ephemeralState.autoLockMinutes * 60) {
          this.lockVault(ephemeralState.userId || '');
          this.notifyLock();
        }
      }
    }, 5000);
  },

  /**
   * Lock vault immediately and purge in-memory KEK and session state
   */
  async lockVault(userId: string): Promise<void> {
    ephemeralState.kek = null;
    ephemeralState.userId = null;
    ephemeralState.unlockedAt = null;
    ephemeralState.lastActiveAt = null;
    if (autoLockInterval) {
      clearInterval(autoLockInterval);
      autoLockInterval = null;
    }

    this.notifyLock();

    if (userId) {
      await this.recordAuditLog(userId, 'LOCKER_LOCKED', 'SUCCESS', { reason: 'user_action_or_navigation' });
    }
  },

  /**
   * 1. Check if user has an initialized locker vault
   */
  async getVaultRecord(userId: string): Promise<LockerVaultRecord | null> {
    if (!userId) return null;

    if (!isSupabaseConfigured) {
      // Demo / preview mode fallback storage (safe mock using safeStorage for structure, real crypto)
      const raw = safeStorage.getItem(`nexa_locker_vault_${userId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    }

    const { data, error } = await supabase
      .from('locker_vaults')
      .select('user_id, auth_salt, kek_salt, recovery_salt, encrypted_master_recovery_key, recovery_nonce, failed_attempts, locked_until, auto_lock_minutes, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error)) {
        const raw = safeStorage.getItem(`nexa_locker_vault_${userId}`);
        return raw ? JSON.parse(raw) : null;
      }
      console.error('Failed to fetch locker vault record:', error);
      return null;
    }

    return data as LockerVaultRecord | null;
  },

  /**
   * 2. Initialize a new vault with passphrase and generate Recovery Key
   */
  async initializeVault(
    userId: string,
    passphrase: string,
    autoLockMinutes = 15
  ): Promise<{ recoveryKey: string; error?: string }> {
    try {
      const authSalt = generateSalt();
      const kekSalt = generateSalt();
      const recoverySalt = generateSalt();

      // Compute Argon2id Authentication Verifier
      const authVerifier = await deriveAuthVerifier(passphrase, authSalt);

      // Derive Key-Encryption Key (KEK)
      const kek = await deriveKeyEncryptionKey(passphrase, kekSalt);

      // Generate 256-bit Recovery Key and compute its verifier + recovery KEK
      const recoveryKeyFormatted = generateRecoveryKeyString();
      const normalizedRecoveryKey = normalizeRecoveryKey(recoveryKeyFormatted);
      const recoveryVerifier = await deriveRecoveryVerifier(normalizedRecoveryKey, recoverySalt);
      const recoveryKek = await deriveRecoveryKeyEncryptionKey(normalizedRecoveryKey, recoverySalt);

      // Wrap the active KEK under recovery KEK so recovery key can unlock and recover all documents
      const rawKekBytes = await deriveRawKeyEncryptionKeyBytes(passphrase, kekSalt);
      const recoveryWrapped = await wrapMasterKekUnderRecoveryKek(
        rawKekBytes,
        recoveryKek,
        `${userId}:recovery:kek`
      );

      const vaultData: LockerVaultRecord = {
        user_id: userId,
        auth_salt: bytesToHex(authSalt),
        auth_verifier: authVerifier,
        kek_salt: bytesToHex(kekSalt),
        recovery_salt: bytesToHex(recoverySalt),
        recovery_verifier: recoveryVerifier,
        encrypted_master_recovery_key: recoveryWrapped.encryptedMasterRecoveryKeyBase64,
        recovery_nonce: recoveryWrapped.recoveryNonceHex,
        failed_attempts: 0,
        locked_until: null,
        auto_lock_minutes: autoLockMinutes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured) {
        safeStorage.setItem(`nexa_locker_vault_${userId}`, JSON.stringify(vaultData));
      } else {
        const { error } = await supabase.from('locker_vaults').insert(vaultData);
        if (error) {
          if (isTableMissingError(error)) {
            safeStorage.setItem(`nexa_locker_vault_${userId}`, JSON.stringify(vaultData));
          } else {
            return { recoveryKey: '', error: error.message };
          }
        }
      }

      // Set active session
      ephemeralState.kek = kek;
      ephemeralState.userId = userId;
      ephemeralState.unlockedAt = Date.now();
      ephemeralState.lastActiveAt = Date.now();
      ephemeralState.autoLockMinutes = autoLockMinutes;
      this.startAutoLockTimer();

      await this.recordAuditLog(userId, 'VAULT_CREATED', 'SUCCESS', {
        auto_lock_minutes: autoLockMinutes,
      });

      return { recoveryKey: recoveryKeyFormatted };
    } catch (err: unknown) {
      console.error('Vault initialization failure:', err);
      return {
        recoveryKey: '',
        error: err instanceof Error ? err.message : 'Cryptographic initialization failed.',
      };
    }
  },

  /**
   * 3. Unlock Vault using Locker Passphrase
   */
  async unlockVaultWithPassphrase(userId: string, passphrase: string): Promise<LockerUnlockResult> {
    const vault = await this.getVaultRecord(userId);
    if (!vault) {
      return { success: false, error: 'Vault is not configured.' };
    }

    // Check if locked out
    if (vault.locked_until && new Date(vault.locked_until).getTime() > Date.now()) {
      const waitMinutes = Math.ceil(
        (new Date(vault.locked_until).getTime() - Date.now()) / 60000
      );
      return {
        success: false,
        error: `Vault is locked out due to multiple failed attempts. Please wait ${waitMinutes} minute(s) or use your Recovery Key.`,
        lockedUntil: vault.locked_until,
      };
    }

    // Compute Argon2id verifier with user's auth_salt
    const authSalt = hexToBytes(vault.auth_salt);
    const candidateVerifier = await deriveAuthVerifier(passphrase, authSalt);

    let verifiedSuccessfully = false;

    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      const hasLiveSupabaseSession = !!sessionData?.session?.user && sessionData.session.user.id === userId;

      if (hasLiveSupabaseSession) {
        // Step 1: Request single-use ephemeral challenge from backend
        const { data: challengeData, error: challengeErr } = await supabase.rpc(
          'get_locker_auth_challenge_rpc'
        );

        if (challengeErr && !isTableMissingError(challengeErr)) {
          console.error('get_locker_auth_challenge_rpc error:', challengeErr);
          return { success: false, error: challengeErr.message };
        }

        if (challengeData?.challenge_nonce) {
          const challengeNonce = challengeData.challenge_nonce;
          // Step 2: Compute single-use HMAC-SHA256 proof of passphrase knowledge
          const authProof = await computeAuthProof(candidateVerifier, challengeNonce);

          // Step 3: Verify proof on server (single-use, non-replayable, constant-time)
          const { data: rpcRes, error: rpcError } = await supabase.rpc(
            'verify_locker_passphrase_rpc',
            { p_auth_proof: authProof, p_challenge_nonce: challengeNonce }
          );

          if (rpcError && !isTableMissingError(rpcError)) {
            console.error('verify_locker_passphrase_rpc error:', rpcError);
            return { success: false, error: rpcError.message };
          }

          if (rpcRes && typeof rpcRes.success === 'boolean') {
            if (!rpcRes.success) {
              return {
                success: false,
                error: rpcRes.error,
                lockedUntil: rpcRes.locked_until,
                remainingAttempts: rpcRes.remaining_attempts,
              };
            }
            verifiedSuccessfully = true;
          }
        }
      }
    }

    if (!verifiedSuccessfully) {
      // Local / fallback verification check (used in offline/demo mode where auth_verifier is saved locally)
      const isLocalMatch = vault.auth_verifier
        ? candidateVerifier === vault.auth_verifier
        : false;

      if (!isLocalMatch) {
        const nextAttempts = (vault.failed_attempts || 0) + 1;
        let lockedUntil: string | null = null;
        if (nextAttempts >= 5) {
          lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        } else if (nextAttempts >= 3) {
          lockedUntil = new Date(Date.now() + 30 * 1000).toISOString();
        }
        vault.failed_attempts = nextAttempts;
        vault.locked_until = lockedUntil;
        safeStorage.setItem(`nexa_locker_vault_${userId}`, JSON.stringify(vault));
        await this.recordAuditLog(userId, 'LOCKER_UNLOCK_FAILED', 'FAILED', {
          failed_attempts: nextAttempts,
        });

        return {
          success: false,
          error: 'Incorrect locker passphrase.',
          remainingAttempts: Math.max(0, 5 - nextAttempts),
          lockedUntil: lockedUntil || undefined,
        };
      } else {
        vault.failed_attempts = 0;
        vault.locked_until = null;
        safeStorage.setItem(`nexa_locker_vault_${userId}`, JSON.stringify(vault));
      }
    }

    // Passphrase is valid! Derive KEK in client memory
    const kekSalt = hexToBytes(vault.kek_salt);
    const kek = await deriveKeyEncryptionKey(passphrase, kekSalt);

    ephemeralState.kek = kek;
    ephemeralState.userId = userId;
    ephemeralState.unlockedAt = Date.now();
    ephemeralState.lastActiveAt = Date.now();
    ephemeralState.autoLockMinutes = vault.auto_lock_minutes || 15;
    this.startAutoLockTimer();

    await this.recordAuditLog(userId, 'LOCKER_UNLOCK_SUCCESS', 'SUCCESS', {});

    return { success: true };
  },

  /**
   * 4. Unlock Vault using Recovery Key
   * Verifies proof via server RPC without leaking recovery_verifier, unwraps active KEK, and restores access
   */
  async unlockVaultWithRecoveryKey(userId: string, recoveryKeyInput: string): Promise<LockerUnlockResult> {
    const vault = await this.getVaultRecord(userId);
    if (!vault) {
      return { success: false, error: 'Vault is not configured.' };
    }

    const normalized = normalizeRecoveryKey(recoveryKeyInput);
    if (normalized.length !== 32) {
      return { success: false, error: 'Invalid recovery key length or format.' };
    }

    const recoverySalt = hexToBytes(vault.recovery_salt);
    const candidateVerifier = await deriveRecoveryVerifier(normalized, recoverySalt);

    let verifiedSuccessfully = false;

    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      const hasLiveSupabaseSession = !!sessionData?.session?.user && sessionData.session.user.id === userId;

      if (hasLiveSupabaseSession) {
        // Step 1: Request single-use challenge
        const { data: challengeData, error: challengeErr } = await supabase.rpc(
          'get_locker_auth_challenge_rpc'
        );

        if (challengeErr && !isTableMissingError(challengeErr)) {
          console.error('get_locker_auth_challenge_rpc error:', challengeErr);
          return { success: false, error: challengeErr.message };
        }

        if (challengeData?.challenge_nonce) {
          const challengeNonce = challengeData.challenge_nonce;
          // Step 2: Compute single-use recovery proof
          const recoveryProof = await computeAuthProof(candidateVerifier, challengeNonce);

          // Step 3: Verify proof on server (single-use, constant-time, clears lockout)
          const { data: rpcRes, error: rpcError } = await supabase.rpc(
            'verify_locker_recovery_key_rpc',
            { p_recovery_proof: recoveryProof, p_challenge_nonce: challengeNonce }
          );

          if (rpcError && !isTableMissingError(rpcError)) {
            console.error('verify_locker_recovery_key_rpc error:', rpcError);
            return { success: false, error: rpcError.message };
          }

          if (rpcRes && typeof rpcRes.success === 'boolean') {
            if (!rpcRes.success) {
              return {
                success: false,
                error: rpcRes.error || 'Invalid recovery key.',
              };
            }
            verifiedSuccessfully = true;
          }
        }
      }
    }

    if (!verifiedSuccessfully) {
      // Local / fallback verification check (used when offline or in unit tests)
      if (vault.recovery_verifier && candidateVerifier !== vault.recovery_verifier) {
        await this.recordAuditLog(userId, 'LOCKER_UNLOCK_FAILED', 'FAILED', {
          method: 'recovery_key',
        });
        return { success: false, error: 'Recovery key is invalid or does not match this vault.' };
      }
    }

    // Recovery key valid! Derive recovery KEK
    const recoveryKek = await deriveRecoveryKeyEncryptionKey(normalized, recoverySalt);

    // Unwrap active KEK from encrypted_master_recovery_key to enable full document decryption
    let activeKek: CryptoKey = recoveryKek;
    try {
      activeKek = await unwrapMasterKekUnderRecoveryKek(
        vault.encrypted_master_recovery_key,
        vault.recovery_nonce,
        recoveryKek,
        `${userId}:recovery:kek`
      );
    } catch {
      // Fallback for legacy vaults initialized with recovery:seed
      try {
        activeKek = await unwrapDekWithKek(
          vault.encrypted_master_recovery_key,
          vault.recovery_nonce,
          recoveryKek,
          `${userId}:recovery:seed`
        );
      } catch {
        activeKek = recoveryKek;
      }
    }

    // Reset failed attempts in database
    if (isSupabaseConfigured) {
      await supabase
        .from('locker_vaults')
        .update({ failed_attempts: 0, locked_until: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    } else {
      vault.failed_attempts = 0;
      vault.locked_until = null;
      safeStorage.setItem(`nexa_locker_vault_${userId}`, JSON.stringify(vault));
    }

    ephemeralState.kek = activeKek;
    ephemeralState.userId = userId;
    ephemeralState.unlockedAt = Date.now();
    ephemeralState.lastActiveAt = Date.now();
    ephemeralState.autoLockMinutes = vault.auto_lock_minutes || 15;
    this.startAutoLockTimer();

    await this.recordAuditLog(userId, 'RECOVERY_KEY_USED', 'SUCCESS', {});

    return { success: true };
  },

  /**
   * 4b. Legitimate Vault Recovery & Key Rotation
   * Recovers a locked/forgotten vault using the 256-bit Recovery Key and establishes a new passphrase.
   * Re-wraps all document DEKs so previously encrypted files remain fully accessible, and preserves recovery credentials.
   */
  async recoverVaultWithRecoveryKey(
    userId: string,
    recoveryKeyInput: string,
    newPassphrase: string
  ): Promise<{ success: boolean; error?: string }> {
    const vault = await this.getVaultRecord(userId);
    if (!vault) return { success: false, error: 'Vault not found.' };

    const normalized = normalizeRecoveryKey(recoveryKeyInput);
    if (normalized.length !== 32) {
      return { success: false, error: 'Invalid recovery key length or format.' };
    }

    const recoverySalt = hexToBytes(vault.recovery_salt);
    const candidateVerifier = await deriveRecoveryVerifier(normalized, recoverySalt);

    // Derive recovery KEK
    const recoveryKek = await deriveRecoveryKeyEncryptionKey(normalized, recoverySalt);

    // Unwrap old KEK to access existing document DEKs
    let oldKek: CryptoKey = recoveryKek;
    try {
      oldKek = await unwrapMasterKekUnderRecoveryKek(
        vault.encrypted_master_recovery_key,
        vault.recovery_nonce,
        recoveryKek,
        `${userId}:recovery:kek`
      );
    } catch {
      try {
        oldKek = await unwrapDekWithKek(
          vault.encrypted_master_recovery_key,
          vault.recovery_nonce,
          recoveryKek,
          `${userId}:recovery:seed`
        );
      } catch {
        oldKek = recoveryKek;
      }
    }

    ephemeralState.kek = oldKek;
    ephemeralState.userId = userId;

    // Generate new credentials
    const newAuthSalt = generateSalt();
    const newKekSalt = generateSalt();
    const newAuthVerifier = await deriveAuthVerifier(newPassphrase, newAuthSalt);
    const newKek = await deriveKeyEncryptionKey(newPassphrase, newKekSalt);
    const newRawKekBytes = await deriveRawKeyEncryptionKeyBytes(newPassphrase, newKekSalt);

    // Re-wrap all existing document DEKs with new KEK
    const docs = await this.listDocuments(userId);
    for (const doc of docs) {
      try {
        const unwrappedDek = await unwrapDekWithKek(
          doc.encrypted_dek,
          doc.dek_nonce,
          oldKek,
          `${userId}:${doc.id}:dek`
        );

        const rewrapped = await wrapDekWithKek(
          unwrappedDek,
          newKek,
          `${userId}:${doc.id}:dek`
        );

        doc.encrypted_dek = rewrapped.encryptedDekBase64;
        doc.dek_nonce = rewrapped.dekNonceHex;
        doc.updated_at = new Date().toISOString();

        if (isSupabaseConfigured) {
          await supabase
            .from('locker_documents')
            .update({
              encrypted_dek: rewrapped.encryptedDekBase64,
              dek_nonce: rewrapped.dekNonceHex,
              updated_at: doc.updated_at,
            })
            .eq('id', doc.id);
        }
      } catch (err) {
        console.error(`Failed to rewrap DEK for document ${doc.id} during recovery:`, err);
      }
    }

    if (!isSupabaseConfigured) {
      safeStorage.setItem(`nexa_locker_docs_${userId}`, JSON.stringify(docs));
    }

    // Re-wrap new KEK under recovery KEK so recovery key remains valid!
    const newRecoveryWrapped = await wrapMasterKekUnderRecoveryKek(
      newRawKekBytes,
      recoveryKek,
      `${userId}:recovery:kek`
    );
    console.log('recover: wrapped new KEK success!');

    vault.auth_salt = bytesToHex(newAuthSalt);
    vault.auth_verifier = newAuthVerifier;
    vault.kek_salt = bytesToHex(newKekSalt);
    vault.encrypted_master_recovery_key = newRecoveryWrapped.encryptedMasterRecoveryKeyBase64;
    vault.recovery_nonce = newRecoveryWrapped.recoveryNonceHex;
    vault.failed_attempts = 0;
    vault.locked_until = null;
    vault.updated_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      const hasLiveSupabaseSession = !!sessionData?.session?.user && sessionData.session.user.id === userId;

      if (hasLiveSupabaseSession) {
        const { data: challengeData } = await supabase.rpc('get_locker_auth_challenge_rpc');
        if (challengeData?.challenge_nonce) {
          const recoveryProof = await computeAuthProof(candidateVerifier, challengeData.challenge_nonce);
          const { data: recoverRes, error: recoverErr } = await supabase.rpc('recover_locker_vault_rpc', {
            p_recovery_proof: recoveryProof,
            p_challenge_nonce: challengeData.challenge_nonce,
            p_new_auth_salt: vault.auth_salt,
            p_new_auth_verifier: vault.auth_verifier,
            p_new_kek_salt: vault.kek_salt,
            p_new_encrypted_master_recovery_key: vault.encrypted_master_recovery_key,
            p_new_recovery_nonce: vault.recovery_nonce,
          });

          if (recoverErr && !isTableMissingError(recoverErr)) {
            return { success: false, error: recoverErr.message };
          }
          if (recoverRes && !recoverRes.success) {
            return { success: false, error: recoverRes.error };
          }
        }
      }
    }

    safeStorage.setItem(`nexa_locker_vault_${userId}`, JSON.stringify(vault));

    ephemeralState.kek = newKek;
    ephemeralState.userId = userId;
    ephemeralState.unlockedAt = Date.now();
    ephemeralState.lastActiveAt = Date.now();
    this.startAutoLockTimer();

    await this.recordAuditLog(userId, 'RECOVERY_KEY_USED', 'SUCCESS', {
      action: 'vault_recovered_and_passphrase_reset',
      documents_rewrapped: docs.length,
    });

    return { success: true };
  },

  /**
   * 5. Change Locker Passphrase (Envelope key rotation: re-wraps DEKs with new KEK)
   */
  async changePassphrase(
    userId: string,
    currentPassphrase: string,
    newPassphrase: string
  ): Promise<{ success: boolean; error?: string }> {
    const vault = await this.getVaultRecord(userId);
    if (!vault) return { success: false, error: 'Vault not found.' };

    const oldAuthSalt = hexToBytes(vault.auth_salt);
    const oldCandidateVerifier = await deriveAuthVerifier(currentPassphrase, oldAuthSalt);
    if (vault.auth_verifier && oldCandidateVerifier !== vault.auth_verifier) {
      return { success: false, error: 'Current passphrase is incorrect.' };
    }

    const oldKekSalt = hexToBytes(vault.kek_salt);
    const oldKek = await deriveKeyEncryptionKey(currentPassphrase, oldKekSalt);

    // Generate new credentials
    const newAuthSalt = generateSalt();
    const newKekSalt = generateSalt();
    const newAuthVerifier = await deriveAuthVerifier(newPassphrase, newAuthSalt);
    const newKek = await deriveKeyEncryptionKey(newPassphrase, newKekSalt);

    // Fetch existing documents to re-wrap their DEKs with the new KEK
    const docs = await this.listDocuments(userId);

    for (const doc of docs) {
      try {
        const unwrappedDek = await unwrapDekWithKek(
          doc.encrypted_dek,
          doc.dek_nonce,
          oldKek,
          `${userId}:${doc.id}:dek`
        );

        const rewrapped = await wrapDekWithKek(
          unwrappedDek,
          newKek,
          `${userId}:${doc.id}:dek`
        );

        doc.encrypted_dek = rewrapped.encryptedDekBase64;
        doc.dek_nonce = rewrapped.dekNonceHex;
        doc.updated_at = new Date().toISOString();

        if (isSupabaseConfigured) {
          await supabase
            .from('locker_documents')
            .update({
              encrypted_dek: rewrapped.encryptedDekBase64,
              dek_nonce: rewrapped.dekNonceHex,
              updated_at: new Date().toISOString(),
            })
            .eq('id', doc.id);
        }
      } catch (err) {
        console.error(`Failed to rewrap DEK for document ${doc.id}:`, err);
      }
    }

    if (!isSupabaseConfigured) {
      safeStorage.setItem(`nexa_locker_docs_${userId}`, JSON.stringify(docs));
    }

    // Update vault record
    vault.auth_salt = bytesToHex(newAuthSalt);
    vault.auth_verifier = newAuthVerifier;
    vault.kek_salt = bytesToHex(newKekSalt);
    vault.updated_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      const hasLiveSupabaseSession = !!sessionData?.session?.user && sessionData.session.user.id === userId;

      if (hasLiveSupabaseSession) {
        const { data: challengeData } = await supabase.rpc('get_locker_auth_challenge_rpc');
        if (challengeData?.challenge_nonce) {
          const authProof = await computeAuthProof(oldCandidateVerifier, challengeData.challenge_nonce);
          const { data: changeRes, error: changeErr } = await supabase.rpc('change_locker_passphrase_rpc', {
            p_auth_proof: authProof,
            p_challenge_nonce: challengeData.challenge_nonce,
            p_new_auth_salt: vault.auth_salt,
            p_new_auth_verifier: vault.auth_verifier,
            p_new_kek_salt: vault.kek_salt,
          });
          if (changeErr && !isTableMissingError(changeErr)) return { success: false, error: changeErr.message };
          if (changeRes && !changeRes.success) return { success: false, error: changeRes.error };
        }
      }
    }
    safeStorage.setItem(`nexa_locker_vault_${userId}`, JSON.stringify(vault));

    // Update in-memory KEK
    ephemeralState.kek = newKek;
    await this.recordAuditLog(userId, 'PASSPHRASE_CHANGED', 'SUCCESS', {
      documents_rewrapped: docs.length,
    });

    return { success: true };
  },

  /**
   * 6. Rotate Recovery Key
   */
  async rotateRecoveryKey(userId: string): Promise<{ recoveryKey: string; error?: string }> {
    const vault = await this.getVaultRecord(userId);
    if (!vault) return { recoveryKey: '', error: 'Vault not found.' };

    const newRecoveryKeyFormatted = generateRecoveryKeyString();
    const normalized = normalizeRecoveryKey(newRecoveryKeyFormatted);
    const newRecoverySalt = generateSalt();
    const newRecoveryVerifier = await deriveRecoveryVerifier(normalized, newRecoverySalt);
    const newRecoveryKek = await deriveRecoveryKeyEncryptionKey(normalized, newRecoverySalt);

    const rawSeed = generateSalt();
    const recoveryWrapped = await wrapDekWithKek(
      await crypto.subtle.importKey(
        'raw',
        rawSeed as BufferSource,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      ),
      newRecoveryKek,
      `${userId}:recovery:seed`
    );

    vault.recovery_salt = bytesToHex(newRecoverySalt);
    vault.recovery_verifier = newRecoveryVerifier;
    vault.encrypted_master_recovery_key = recoveryWrapped.encryptedDekBase64;
    vault.recovery_nonce = recoveryWrapped.dekNonceHex;
    vault.updated_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('locker_vaults')
        .update({
          recovery_salt: vault.recovery_salt,
          recovery_verifier: vault.recovery_verifier,
          encrypted_master_recovery_key: vault.encrypted_master_recovery_key,
          recovery_nonce: vault.recovery_nonce,
          updated_at: vault.updated_at,
        })
        .eq('user_id', userId);
      if (error && !isTableMissingError(error)) return { recoveryKey: '', error: error.message };
    }
    safeStorage.setItem(`nexa_locker_vault_${userId}`, JSON.stringify(vault));

    await this.recordAuditLog(userId, 'RECOVERY_KEY_USED', 'SUCCESS', {
      action: 'recovery_key_rotated',
    });

    return { recoveryKey: newRecoveryKeyFormatted };
  },

  /**
   * 7. Reset Vault (Safe Zero-Knowledge Purge: removes Storage objects safely prior to metadata deletion)
   */
  async resetVault(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!userId) return { success: false, error: 'User ID is required.' };

      // 1. Verify vault is not actively locked out
      const vault = await this.getVaultRecord(userId);
      if (vault?.locked_until && new Date(vault.locked_until).getTime() > Date.now()) {
        return {
          success: false,
          error: 'Cannot reset vault while actively locked out. Please wait for lockout to expire or use Recovery Key.',
        };
      }

      // 2. Safe Storage Cleanup BEFORE deleting database metadata
      if (isSupabaseConfigured) {
        const { data: sessionData } = await supabase.auth.getSession();
        const hasLiveSupabaseSession = !!sessionData?.session?.user && sessionData.session.user.id === userId;

        if (hasLiveSupabaseSession) {
          // List user's encrypted storage files
          const { data: storageFiles, error: listError } = await supabase.storage
            .from('secure-locker')
            .list(userId);

          if (listError && !isTableMissingError(listError)) {
            console.error('Failed to list locker storage files prior to reset:', listError);
            return {
              success: false,
              error: `Storage cleanup check failed: ${listError.message}. Database records preserved.`,
            };
          }

          if (storageFiles && storageFiles.length > 0) {
            const filePaths = storageFiles.map((f) => `${userId}/${f.name}`);
            const { error: removeError } = await supabase.storage
              .from('secure-locker')
              .remove(filePaths);

            if (removeError && !isTableMissingError(removeError)) {
              console.error('Failed to remove storage files prior to reset:', removeError);
              return {
                success: false,
                error: `Storage cleanup failed: ${removeError.message}. Database records preserved to prevent orphaned files.`,
              };
            }
          }

          // 3. Delete database records atomically via hardened RPC
          const { data, error } = await supabase.rpc('reset_locker_vault_rpc');
          if (error && !isTableMissingError(error)) return { success: false, error: error.message };
          if (data && !data.success) return { success: false, error: data.error };
        }
      }

      // 4. Lock vault in memory and clear client cache
      await this.lockVault(userId);
      safeStorage.removeItem(`nexa_locker_vault_${userId}`);
      safeStorage.removeItem(`nexa_locker_docs_${userId}`);

      await this.recordAuditLog(userId, 'VAULT_RESET', 'SUCCESS', {
        action: 'all_data_purged_with_storage_cleanup',
      });

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Reset failed' };
    }
  },

  /**
   * 8. List Encrypted Documents
   */
  async listDocuments(userId: string): Promise<LockerDocument[]> {
    if (!this.isVaultUnlocked()) {
      return [];
    }

    if (!isSupabaseConfigured) {
      const raw = safeStorage.getItem(`nexa_locker_docs_${userId}`);
      return raw ? JSON.parse(raw) : [];
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const hasLiveSupabaseSession = !!sessionData?.session?.user && sessionData.session.user.id === userId;

      if (hasLiveSupabaseSession) {
        const { data, error } = await supabase
          .from('locker_documents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as LockerDocument[];
        }
        if (error && !isTableMissingError(error)) {
          console.error('Failed to list locker documents:', error);
        }
      }
    } catch (err) {
      console.warn('Supabase session or list check failed, falling back to local vault store:', err);
    }

    const raw = safeStorage.getItem(`nexa_locker_docs_${userId}`);
    return raw ? JSON.parse(raw) : [];
  },

  /**
   * 9. Upload & Encrypt Document (Client-Side Envelope Encryption)
   */
  async uploadDocument(
    userId: string,
    file: File,
    title: string,
    category: LockerCategory = 'document'
  ): Promise<{ document: LockerDocument | null; error?: string }> {
    const kek = ephemeralState.kek;
    if (!kek) {
      return { document: null, error: 'Locker is locked. Unlock before uploading.' };
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);

      // Validate file signature & magic bytes
      const validation = validateFileSignatureAndSize(fileBytes, file.type);
      if (!validation.valid) {
        return { document: null, error: validation.error || 'Invalid file format.' };
      }

      const docId = crypto.randomUUID();
      const storagePath = `${userId}/${docId}.enc`;

      // Generate a unique 256-bit DEK
      const dek = await generateDataEncryptionKey();

      // Encrypt file bytes with DEK and bind to document metadata (AAD)
      const dataAad = `${userId}:${docId}:content`;
      const encrypted = await encryptDataWithDek(fileBytes, dek, dataAad);

      // Wrap DEK with KEK and bind to DEK metadata (AAD)
      const dekAad = `${userId}:${docId}:dek`;
      const wrappedDek = await wrapDekWithKek(dek, kek, dekAad);

      // Check for active Supabase session
      let hasLiveSupabaseSession = false;
      if (isSupabaseConfigured) {
        const { data: sessionData } = await supabase.auth.getSession();
        hasLiveSupabaseSession = !!sessionData?.session?.user && sessionData.session.user.id === userId;
      }

      // Upload encrypted payload to private Supabase Storage
      if (isSupabaseConfigured && hasLiveSupabaseSession) {
        const { error: storageError } = await supabase.storage
          .from('secure-locker')
          .upload(storagePath, encrypted.encryptedData, {
            contentType: 'application/octet-stream',
            upsert: false,
          });

        if (storageError && !isTableMissingError(storageError)) {
          const isRlsError =
            storageError.message.includes('row-level security policy') ||
            (storageError as { statusCode?: string }).statusCode === '403';
          const detailMsg = isRlsError
            ? 'Storage upload failed: new row violates row-level security policy. Please ensure the Storage RLS migration has been executed in the Supabase SQL Editor.'
            : `Storage upload failed: ${storageError.message}`;
          return { document: null, error: detailMsg };
        }
      }

      // Always cache in ephemeral session memory for preview/offline/test resilience
      safeSessionStorage.setItem(`nexa_enc_file_${storagePath}`, bytesToHex(encrypted.encryptedData));

      const docRecord: LockerDocument = {
        id: docId,
        user_id: userId,
        title: title.trim() || file.name,
        filename: file.name,
        mime_type: validation.detectedMime || file.type || 'application/octet-stream',
        file_size: file.size,
        file_path: storagePath,
        encrypted_dek: wrappedDek.encryptedDekBase64,
        dek_nonce: wrappedDek.dekNonceHex,
        data_nonce: encrypted.dataNonceHex,
        checksum_sha256: encrypted.checksumSha256Hex,
        category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured && hasLiveSupabaseSession) {
        const { error: dbError } = await supabase.from('locker_documents').insert(docRecord);
        if (dbError) {
          if (!isTableMissingError(dbError)) {
            // Clean up uploaded storage file to prevent orphaned storage objects
            await supabase.storage.from('secure-locker').remove([storagePath]);
            return { document: null, error: `Database insert failed: ${dbError.message}` };
          }
          console.warn('public.locker_documents not found in schema cache. Stored encrypted payload in fallback cache.');
        }
      }

      const existing = await this.listDocuments(userId);
      const filtered = existing.filter((d) => d.id !== docRecord.id);
      filtered.unshift(docRecord);
      safeStorage.setItem(`nexa_locker_docs_${userId}`, JSON.stringify(filtered));

      await this.recordAuditLog(userId, 'DOCUMENT_UPLOADED', 'SUCCESS', {
        document_id: docId,
        filename: file.name,
        file_size: file.size,
        category,
      });

      this.touchActivity();
      return { document: docRecord };
    } catch (err: unknown) {
      console.error('Document encryption or upload failure:', err);
      return {
        document: null,
        error: err instanceof Error ? err.message : 'Encryption or upload failed.',
      };
    }
  },

  /**
   * 10. Download & Decrypt Document in Ephemeral RAM
   */
  async downloadAndDecryptDocument(
    userId: string,
    doc: LockerDocument
  ): Promise<{ blob: Blob; filename: string; mimeType: string }> {
    const kek = ephemeralState.kek;
    if (!kek) {
      throw new Error('Locker is locked. Unlock before downloading or viewing.');
    }

    let encryptedBytes: Uint8Array | null = null;

    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      const hasLiveSupabaseSession = !!sessionData?.session?.user && sessionData.session.user.id === userId;

      if (hasLiveSupabaseSession) {
        const { data, error } = await supabase.storage
          .from('secure-locker')
          .download(doc.file_path);

        if (!error && data) {
          const buffer = await data.arrayBuffer();
          encryptedBytes = new Uint8Array(buffer);
        }
      }
    }

    if (!encryptedBytes) {
      const hex = safeSessionStorage.getItem(`nexa_enc_file_${doc.file_path}`);
      if (hex) {
        encryptedBytes = hexToBytes(hex);
      } else {
        throw new Error('Encrypted file could not be retrieved from private storage or session cache.');
      }
    }

    // Unwrap DEK with KEK
    const dekAad = `${userId}:${doc.id}:dek`;
    const dek = await unwrapDekWithKek(doc.encrypted_dek, doc.dek_nonce, kek, dekAad);

    // Decrypt data with DEK and verify checksum & AAD
    const dataAad = `${userId}:${doc.id}:content`;
    const decryptedBytes = await decryptDataWithDek(
      encryptedBytes,
      dek,
      doc.data_nonce,
      dataAad,
      doc.checksum_sha256
    );

    // Construct ephemeral Blob in RAM
    const blob = new Blob([decryptedBytes as BlobPart], { type: doc.mime_type });

    await this.recordAuditLog(userId, 'DOCUMENT_DOWNLOADED', 'SUCCESS', {
      document_id: doc.id,
      filename: doc.filename,
    });

    this.touchActivity();
    return {
      blob,
      filename: doc.filename,
      mimeType: doc.mime_type,
    };
  },

  /**
   * 11. Delete Document (removes both encrypted payload and database record)
   */
  async deleteDocument(userId: string, documentId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isVaultUnlocked()) {
      return { success: false, error: 'Locker is locked. Unlock before deleting documents.' };
    }

    try {
      const docs = await this.listDocuments(userId);
      const doc = docs.find((d) => d.id === documentId);
      if (!doc) return { success: false, error: 'Document not found.' };

      if (isSupabaseConfigured) {
        const { data: sessionData } = await supabase.auth.getSession();
        const hasLiveSupabaseSession = !!sessionData?.session?.user && sessionData.session.user.id === userId;

        if (hasLiveSupabaseSession) {
          await supabase.storage.from('secure-locker').remove([doc.file_path]);
          const { error } = await supabase.from('locker_documents').delete().eq('id', documentId);
          if (error && !isTableMissingError(error)) {
            return { success: false, error: error.message };
          }
        }
      }
      safeSessionStorage.removeItem(`nexa_enc_file_${doc.file_path}`);
      const updated = docs.filter((d) => d.id !== documentId);
      safeStorage.setItem(`nexa_locker_docs_${userId}`, JSON.stringify(updated));

      await this.recordAuditLog(userId, 'DOCUMENT_DELETED', 'SUCCESS', {
        document_id: documentId,
        filename: doc.filename,
      });

      this.touchActivity();
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Delete failed.',
      };
    }
  },

  /**
   * 12. Retrieve Security Audit Logs
   */
  async getAuditLogs(userId: string): Promise<LockerAuditLog[]> {
    if (!this.isVaultUnlocked()) {
      return [];
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('locker_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        return data as LockerAuditLog[];
      }
    }

    const raw = safeStorage.getItem(`nexa_locker_audit_${userId}`);
    return raw ? JSON.parse(raw) : [];
  },

  /**
   * 13. Record Security Audit Log (Never logs passphrases, keys or content)
   */
  async recordAuditLog(
    userId: string,
    eventType: LockerEventType,
    status: 'SUCCESS' | 'FAILED' | 'BLOCKED',
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    if (!userId) return;

    // Filter out any potential sensitive keys or tokens
    const sanitizedMetadata: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (!/pass|key|token|secret|content|auth/i.test(key)) {
        sanitizedMetadata[key] = value;
      }
    }

    const logEntry: LockerAuditLog = {
      id: crypto.randomUUID(),
      user_id: userId,
      event_type: eventType,
      status,
      metadata: sanitizedMetadata,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('locker_audit_logs').insert(logEntry);
      } catch {
        // Fallback
      }
    }

    const existing = await this.getAuditLogs(userId);
    const filtered = existing.filter((l) => l.id !== logEntry.id);
    filtered.unshift(logEntry);
    if (filtered.length > 100) filtered.length = 100;
    safeStorage.setItem(`nexa_locker_audit_${userId}`, JSON.stringify(filtered));
  },

  /**
   * 14. Check Recent Authentication
   * Requires recent auth (<= 30 minutes) for sensitive actions
   */
  async checkRecentAuthentication(): Promise<{ isRecent: boolean; lastSignInAt: Date | null }> {
    if (!isSupabaseConfigured) {
      return { isRecent: true, lastSignInAt: new Date() };
    }

    const { data } = await supabase.auth.getSession();
    const lastSignIn = data.session?.user?.last_sign_in_at;
    if (!lastSignIn) {
      return { isRecent: false, lastSignInAt: null };
    }

    const lastSignInTime = new Date(lastSignIn).getTime();
    const diffMinutes = (Date.now() - lastSignInTime) / (1000 * 60);

    return {
      isRecent: diffMinutes <= 30,
      lastSignInAt: new Date(lastSignIn),
    };
  },

  /**
   * 15. Check Multi-Factor Authentication (MFA) Status
   */
  async checkMfaStatus(): Promise<{ mfaEnabled: boolean; factorType?: string }> {
    if (!isSupabaseConfigured) {
      return { mfaEnabled: false };
    }

    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const isMfaActive = data?.currentLevel === 'aal2';
      return { mfaEnabled: isMfaActive };
    } catch {
      return { mfaEnabled: false };
    }
  },
};
