// ==============================================================================
// NEXA Enterprise Productivity Workspace - Secure Locker Types
// Zero-Trust Security Architecture Definition
// ==============================================================================

export type VaultStatus = 'LOADING' | 'NOT_CONFIGURED' | 'LOCKED' | 'UNLOCKED' | 'LOCKED_OUT';

export type LockerCategory = 'document' | 'credential' | 'recovery_phrase' | 'identity';

export interface LockerVaultRecord {
  user_id: string;
  auth_salt: string;
  auth_verifier?: string; // Secret verifier is NEVER returned in client SELECT queries
  kek_salt: string;
  recovery_salt: string;
  recovery_verifier?: string; // Secret recovery verifier is NEVER returned in client SELECT queries
  encrypted_master_recovery_key: string;
  recovery_nonce: string;
  failed_attempts: number;
  locked_until: string | null;
  auto_lock_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface LockerDocument {
  id: string;
  user_id: string;
  title: string;
  filename: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  encrypted_dek: string;
  dek_nonce: string;
  data_nonce: string;
  checksum_sha256: string;
  category: LockerCategory;
  created_at: string;
  updated_at: string;
}

export type LockerEventType =
  | 'LOCKER_UNLOCK_SUCCESS'
  | 'LOCKER_UNLOCK_FAILED'
  | 'LOCKER_LOCKED'
  | 'PASSPHRASE_CHANGED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_DELETED'
  | 'SESSION_REVOKED'
  | 'RECOVERY_KEY_USED'
  | 'VAULT_CREATED'
  | 'LOCKOUT_TRIGGERED'
  | 'VAULT_RESET';

export interface LockerAuditLog {
  id: string;
  user_id: string;
  event_type: LockerEventType;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LockerSession {
  /**
   * The Key-Encryption Key (KEK) is held EXCLUSIVELY in client-side ephemeral RAM.
   * It is NEVER written to localStorage, sessionStorage, cookies, or IndexedDB.
   */
  kek: CryptoKey;
  unlockedAt: number;
  lastActiveAt: number;
  autoLockMinutes: number;
}

export interface LockerUnlockResult {
  success: boolean;
  error?: string;
  lockedUntil?: string;
  remainingAttempts?: number;
  delayMs?: number;
}

export interface FileValidationResult {
  valid: boolean;
  detectedMime?: string;
  error?: string;
}

export interface LockerSetupPayload {
  passphrase: string;
  autoLockMinutes?: number;
}

export interface VaultInitKeys {
  authSaltHex: string;
  authVerifierHex: string;
  kekSaltHex: string;
  recoverySaltHex: string;
  recoveryVerifierHex: string;
  recoveryKeyFormatted: string;
  encryptedRecoveryKeyBase64: string;
  recoveryNonceHex: string;
  kek: CryptoKey;
}
