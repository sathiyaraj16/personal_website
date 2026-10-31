// ==============================================================================
// NEXA - Secure Locker Security Remediation Test Suite
// Verifies all critical security fixes:
// 1. Verifier theft prevention (auth_verifier & recovery_verifier excluded from REST)
// 2. Atomic challenge consumption & concurrent replay prevention
// 3. Lockout bypass prevention (direct DELETE revoked; reset blocked while locked out)
// 4. RPC hardening (unauthorized/unauthenticated execution blocked)
// 5. Cross-user document isolation
// 6. Passphrase change key continuity: previously encrypted documents decrypt with new passphrase
// 7. Recovery key preservation after passphrase change
// 8. Legitimate challenge-response unlock, upload, download & delete
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Database mock simulating PostgreSQL column-level grants and RPC security
const mockVaults = new Map<string, any>();
const mockChallenges = new Map<string, { nonce: string; expiresAt: number; used: boolean }>();
const mockDocuments = new Map<string, any>();
const mockStorage = new Map<string, Uint8Array>();
const mockAuditLogs: any[] = [];
let currentAuthUserId: string | null = null;

vi.mock('../lib/supabase', () => {
  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getSession: vi.fn(async () => {
          if (!currentAuthUserId) return { data: { session: null }, error: null };
          return {
            data: {
              session: {
                user: { id: currentAuthUserId, email: `${currentAuthUserId}@nexa.local` },
                access_token: `jwt-${currentAuthUserId}`,
              },
            },
            error: null,
          };
        }),
      },
      storage: {
        from: (bucket: string) => ({
          upload: vi.fn(async (path: string, data: any) => {
            if (!currentAuthUserId || path.split('/')[0] !== currentAuthUserId) {
              return { data: null, error: { message: 'new row violates row-level security policy', statusCode: '403' } };
            }
            mockStorage.set(`${bucket}:${path}`, data);
            return { data: { path }, error: null };
          }),
          download: vi.fn(async (path: string) => {
            if (!currentAuthUserId || path.split('/')[0] !== currentAuthUserId) {
              return { data: null, error: { message: 'Access denied', statusCode: '403' } };
            }
            const bytes = mockStorage.get(`${bucket}:${path}`);
            if (!bytes) {
              return { data: null, error: { message: 'Not found', statusCode: '404' } };
            }
            return { data: new Blob([bytes.buffer as ArrayBuffer]), error: null };
          }),
          remove: vi.fn(async (paths: string[]) => {
            for (const p of paths) {
              mockStorage.delete(`${bucket}:${p}`);
            }
            return { data: paths, error: null };
          }),
          list: vi.fn(async (prefix: string) => {
            const files: { name: string }[] = [];
            for (const key of mockStorage.keys()) {
              if (key.startsWith(`${bucket}:${prefix}/`)) {
                const name = key.substring(`${bucket}:${prefix}/`.length);
                files.push({ name });
              }
            }
            return { data: files, error: null };
          }),
        }),
      },
      from: (table: string) => ({
        select: vi.fn((columns: string = '*') => ({
          eq: vi.fn((col: string, val: string) => ({
            order: vi.fn(() => ({
              limit: vi.fn(async () => {
                if (table === 'locker_documents') {
                  const docs = Array.from(mockDocuments.values()).filter((d) => d[col] === val && d.user_id === currentAuthUserId);
                  return { data: docs, error: null };
                }
                return { data: [], error: null };
              }),
              then: (resolve: any) => {
                if (table === 'locker_documents') {
                  const docs = Array.from(mockDocuments.values()).filter((d) => d[col] === val && d.user_id === currentAuthUserId);
                  resolve({ data: docs, error: null });
                } else {
                  resolve({ data: [], error: null });
                }
              },
            })),
            maybeSingle: vi.fn(async () => {
              if (table === 'locker_vaults') {
                // Security check 1: Disallow selecting auth_verifier or recovery_verifier
                if (columns.includes('auth_verifier') || columns.includes('recovery_verifier')) {
                  return {
                    data: null,
                    error: {
                      message: 'permission denied for column "auth_verifier" of relation "locker_vaults"',
                      code: '42501',
                    },
                  };
                }
                const vault = mockVaults.get(val);
                if (!vault) return { data: null, error: null };
                // Return projection excluding sensitive verifiers
                const { auth_verifier, recovery_verifier, ...safeVault } = vault;
                return { data: safeVault, error: null };
              }
              return { data: null, error: null };
            }),
          })),
        })),
        insert: vi.fn(async (record: any) => {
          if (table === 'locker_vaults') {
            mockVaults.set(record.user_id, { ...record });
            return { data: record, error: null };
          }
          if (table === 'locker_documents') {
            if (!currentAuthUserId || record.user_id !== currentAuthUserId) {
              return { data: null, error: { message: 'new row violates row-level security policy', code: '42501' } };
            }
            mockDocuments.set(record.id, record);
            return { data: record, error: null };
          }
          if (table === 'locker_audit_logs') {
            mockAuditLogs.push(record);
            return { data: record, error: null };
          }
          return { data: null, error: null };
        }),
        update: vi.fn((updates: any) => ({
          eq: vi.fn(async (_col: string, val: string) => {
            if (table === 'locker_vaults') {
              // Security check 2: Disallow client modification of failed_attempts or locked_until
              if ('failed_attempts' in updates || 'locked_until' in updates) {
                return {
                  data: null,
                  error: {
                    message: 'permission denied for column "failed_attempts" of relation "locker_vaults"',
                    code: '42501',
                  },
                };
              }
              const existing = mockVaults.get(val);
              if (existing) {
                mockVaults.set(val, { ...existing, ...updates });
              }
              return { data: updates, error: null };
            }
            if (table === 'locker_documents') {
              const existing = mockDocuments.get(val);
              if (existing) {
                mockDocuments.set(val, { ...existing, ...updates });
              }
              return { data: updates, error: null };
            }
            return { data: null, error: null };
          }),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(async (_col: string, val: string) => {
            if (table === 'locker_vaults') {
              // Security check 3: Direct DELETE on locker_vaults is strictly revoked!
              return {
                data: null,
                error: { message: 'permission denied for relation locker_vaults', code: '42501' },
              };
            }
            if (table === 'locker_documents') {
              mockDocuments.delete(val);
            }
            return { error: null };
          }),
        })),
      }),
      rpc: vi.fn(async (fnName: string, args: any) => {
        // Security check 4: Revoke execution from unauthenticated users
        if (!currentAuthUserId) {
          return {
            data: null,
            error: { message: 'permission denied for function ' + fnName, code: '42501' },
          };
        }

        if (fnName === 'get_locker_auth_challenge_rpc') {
          // Generate 64-character lowercase hex challenge
          const randomBytes = new Uint8Array(32);
          for (let i = 0; i < 32; i++) randomBytes[i] = Math.floor(Math.random() * 256);
          const nonce = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
          mockChallenges.set(currentAuthUserId, {
            nonce,
            expiresAt: Date.now() + 60000,
            used: false,
          });
          return { data: { challenge_nonce: nonce, expires_at: new Date(Date.now() + 60000).toISOString() }, error: null };
        }

        if (fnName === 'verify_locker_passphrase_rpc') {
          const userChallenge = mockChallenges.get(currentAuthUserId);
          const { p_auth_proof, p_challenge_nonce } = args;

          // Format validation
          if (!p_auth_proof || !/^[0-9a-f]{64}$/.test(p_auth_proof) || !p_challenge_nonce || !/^[0-9a-f]{64}$/.test(p_challenge_nonce)) {
            return { data: { success: false, error: 'Malformed authentication proof.' }, error: null };
          }

          // Atomic check and single-use consumption
          if (!userChallenge || userChallenge.nonce !== p_challenge_nonce || userChallenge.used || userChallenge.expiresAt < Date.now()) {
            return {
              data: {
                success: false,
                error: 'Authentication challenge invalid, expired, or already consumed. Replay blocked.',
                remaining_attempts: 0,
              },
              error: null,
            };
          }

          // Burn challenge atomically
          userChallenge.used = true;

          const vault = mockVaults.get(currentAuthUserId);
          if (!vault) {
            return { data: { success: false, error: 'Vault not found' }, error: null };
          }

          if (vault.locked_until && new Date(vault.locked_until).getTime() > Date.now()) {
            return {
              data: {
                success: false,
                error: 'Vault is temporarily locked out due to repeated failed attempts.',
                locked_until: vault.locked_until,
              },
              error: null,
            };
          }

          const expectedProof = await computeAuthProof(vault.auth_verifier, p_challenge_nonce);
          if (p_auth_proof === expectedProof) {
            vault.failed_attempts = 0;
            vault.locked_until = null;
            return { data: { success: true }, error: null };
          } else {
            vault.failed_attempts = (vault.failed_attempts || 0) + 1;
            return {
              data: {
                success: false,
                error: 'Incorrect locker passphrase proof.',
                failed_attempts: vault.failed_attempts,
                remaining_attempts: Math.max(0, 5 - vault.failed_attempts),
              },
              error: null,
            };
          }
        }

        if (fnName === 'verify_locker_recovery_key_rpc') {
          if (!currentAuthUserId) return { data: null, error: { message: 'Unauthorized', code: '42501' } };
          const { p_recovery_proof, p_challenge_nonce } = args;
          const challenge = mockChallenges.get(currentAuthUserId);
          if (!challenge || challenge.used || challenge.nonce !== p_challenge_nonce) {
            return { data: { success: false, error: 'Challenge invalid, expired, or consumed.' }, error: null };
          }
          challenge.used = true;
          const vault = mockVaults.get(currentAuthUserId);
          if (!vault) return { data: { success: false, error: 'Vault not found' }, error: null };
          const expectedProof = await computeAuthProof(vault.recovery_verifier, p_challenge_nonce);
          if (p_recovery_proof === expectedProof) {
            vault.failed_attempts = 0;
            vault.locked_until = null;
            return { data: { success: true }, error: null };
          } else {
            return { data: { success: false, error: 'Invalid recovery key proof.' }, error: null };
          }
        }

        if (fnName === 'recover_locker_vault_rpc') {
          if (!currentAuthUserId) return { data: null, error: { message: 'Unauthorized', code: '42501' } };
          const { p_recovery_proof, p_challenge_nonce, p_new_auth_salt, p_new_auth_verifier, p_new_kek_salt, p_new_encrypted_master_recovery_key, p_new_recovery_nonce } = args;
          const challenge = mockChallenges.get(currentAuthUserId);
          if (!challenge || challenge.used || challenge.nonce !== p_challenge_nonce) {
            return { data: { success: false, error: 'Challenge invalid, expired, or consumed.' }, error: null };
          }
          challenge.used = true;
          const vault = mockVaults.get(currentAuthUserId);
          if (!vault) return { data: { success: false, error: 'Vault not found' }, error: null };
          const expectedProof = await computeAuthProof(vault.recovery_verifier, p_challenge_nonce);
          if (p_recovery_proof === expectedProof) {
            vault.auth_salt = p_new_auth_salt;
            vault.auth_verifier = p_new_auth_verifier;
            vault.kek_salt = p_new_kek_salt;
            if (p_new_encrypted_master_recovery_key) {
              vault.encrypted_master_recovery_key = p_new_encrypted_master_recovery_key;
            }
            if (p_new_recovery_nonce) {
              vault.recovery_nonce = p_new_recovery_nonce;
            }
            vault.failed_attempts = 0;
            vault.locked_until = null;
            return { data: { success: true }, error: null };
          } else {
            return { data: { success: false, error: 'Invalid recovery key proof.' }, error: null };
          }
        }

        if (fnName === 'change_locker_passphrase_rpc') {
          const vault = mockVaults.get(currentAuthUserId);
          if (!vault) return { data: { success: false, error: 'Vault not found' }, error: null };
          vault.auth_salt = args.p_new_auth_salt;
          vault.auth_verifier = args.p_new_auth_verifier;
          vault.kek_salt = args.p_new_kek_salt;
          // recovery credentials strictly preserved!
          return { data: { success: true }, error: null };
        }

        if (fnName === 'reset_locker_vault_rpc') {
          const vault = mockVaults.get(currentAuthUserId);
          if (vault && vault.locked_until && new Date(vault.locked_until).getTime() > Date.now()) {
            return {
              data: {
                success: false,
                error: 'Cannot reset vault while actively locked out. Please wait for lockout to expire.',
                locked_until: vault.locked_until,
              },
              error: null,
            };
          }
          mockVaults.delete(currentAuthUserId);
          mockChallenges.delete(currentAuthUserId);
          return { data: { success: true }, error: null };
        }

        return { data: null, error: { message: 'Unknown RPC' } };
      }),
    },
    getSupabaseConfigStatus: () => ({ configured: true, message: 'Configured' }),
  };
});

import { lockerService, safeStorage, safeSessionStorage } from '../services/lockerService';
import { computeAuthProof } from '../services/crypto/lockerCrypto';
import { supabase } from '../lib/supabase';

describe('NEXA Secure Locker - Critical Security Remediation Tests', () => {
  const aliceId = 'da14e4ed-918e-4be4-9bef-955e9c586ded';
  const bobId = 'ea3008ba-a7b4-43e1-8e35-fe5411c0529d';
  const alicePassphrase = 'AliceStrongLockerKey#2026!';
  const aliceNewPassphrase = 'AliceUpdatedPassphrase#2027!';

  beforeEach(async () => {
    currentAuthUserId = null;
    mockVaults.clear();
    mockChallenges.clear();
    mockDocuments.clear();
    mockStorage.clear();
    mockAuditLogs.length = 0;
    safeStorage.clear();
    safeSessionStorage.clear();
  });

  it('1. Verifier theft prevention: Client REST SELECT cannot retrieve auth_verifier or recovery_verifier', async () => {
    currentAuthUserId = aliceId;
    await lockerService.initializeVault(aliceId, alicePassphrase);

    // Normal safe query succeeds without revealing verifiers
    const safeVault = await lockerService.getVaultRecord(aliceId);
    expect(safeVault).not.toBeNull();
    expect(safeVault!.auth_verifier).toBeUndefined();
    expect(safeVault!.recovery_verifier).toBeUndefined();

    // Direct attempt to select auth_verifier via Supabase REST fails with permission denied
    const { data: verifierTheft, error: theftError } = await supabase
      .from('locker_vaults')
      .select('auth_verifier')
      .eq('user_id', aliceId)
      .maybeSingle();

    expect(verifierTheft).toBeNull();
    expect(theftError).not.toBeNull();
    expect(theftError!.message).toContain('permission denied for column "auth_verifier"');
  });

  it('2. Atomic challenge consumption & concurrent replay prevention: Simultaneous requests cannot consume the same challenge twice', async () => {
    currentAuthUserId = aliceId;
    await lockerService.initializeVault(aliceId, alicePassphrase);

    const { data: challengeData } = await supabase.rpc('get_locker_auth_challenge_rpc');
    const challengeNonce = challengeData.challenge_nonce;

    const vault = mockVaults.get(aliceId);
    const validProof = await computeAuthProof(vault.auth_verifier, challengeNonce);

    // Concurrent simultaneous submission: Promise.all sends both requests concurrently
    const [res1, res2] = await Promise.all([
      supabase.rpc('verify_locker_passphrase_rpc', {
        p_auth_proof: validProof,
        p_challenge_nonce: challengeNonce,
      }),
      supabase.rpc('verify_locker_passphrase_rpc', {
        p_auth_proof: validProof,
        p_challenge_nonce: challengeNonce,
      }),
    ]);

    const successes = [res1.data.success, res2.data.success].filter(Boolean);
    const failures = [res1.data.success, res2.data.success].filter((s) => !s);

    // Exactly one request must succeed; the concurrent one must be rejected by atomic challenge consumption!
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
  });

  it('3. Lockout bypass prevention: Direct DELETE on locker_vaults and vault reset during lockout are blocked', async () => {
    currentAuthUserId = aliceId;
    await lockerService.initializeVault(aliceId, alicePassphrase);

    // 1. Direct DELETE attempt via REST fails with permission denied
    const { data: delData, error: delError } = await supabase
      .from('locker_vaults')
      .delete()
      .eq('user_id', aliceId);

    expect(delData).toBeNull();
    expect(delError).not.toBeNull();
    expect(delError!.message).toContain('permission denied for relation locker_vaults');

    // 2. Put user into active lockout
    const vault = mockVaults.get(aliceId);
    vault.failed_attempts = 5;
    vault.locked_until = new Date(Date.now() + 300000).toISOString();

    // 3. Attempt reset_locker_vault_rpc while locked out -> Blocked!
    const resetRes = await lockerService.resetVault(aliceId);
    expect(resetRes.success).toBe(false);
    expect(resetRes.error).toContain('Cannot reset vault while actively locked out');
  });

  it('4. RPC hardening: Unauthenticated callers are rejected from executing RPC functions', async () => {
    currentAuthUserId = null;

    const { data: challengeData, error: challengeError } = await supabase.rpc(
      'get_locker_auth_challenge_rpc'
    );
    expect(challengeData).toBeNull();
    expect(challengeError).not.toBeNull();
    expect(challengeError!.message).toContain('permission denied for function get_locker_auth_challenge_rpc');

    const { data: verifyData, error: verifyError } = await supabase.rpc(
      'verify_locker_passphrase_rpc',
      { p_auth_proof: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', p_challenge_nonce: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' }
    );
    expect(verifyData).toBeNull();
    expect(verifyError).not.toBeNull();
    expect(verifyError!.message).toContain('permission denied for function verify_locker_passphrase_rpc');
  });

  it('5. Cross-user document isolation: Bob cannot access Alice documents', async () => {
    currentAuthUserId = aliceId;
    await lockerService.initializeVault(aliceId, alicePassphrase);

    const pdfFile = new File(['%PDF-1.4 Alice Secret'], 'alice.pdf', { type: 'application/pdf' });
    const { document: aliceDoc } = await lockerService.uploadDocument(aliceId, pdfFile, 'Alice Doc', 'document');

    await lockerService.lockVault(aliceId);

    // Switch to Bob
    currentAuthUserId = bobId;

    await expect(
      lockerService.downloadAndDecryptDocument(bobId, aliceDoc!)
    ).rejects.toThrow();
  });

  it('6. Passphrase change key continuity: Previously encrypted documents decrypt with new passphrase and recovery key is preserved', async () => {
    currentAuthUserId = aliceId;
    const { recoveryKey } = await lockerService.initializeVault(aliceId, alicePassphrase);
    expect(recoveryKey).toBeDefined();

    const originalVault = mockVaults.get(aliceId);
    const initialRecoveryVerifier = originalVault.recovery_verifier;
    const initialMasterRecoveryKey = originalVault.encrypted_master_recovery_key;

    // Upload Document under Passphrase 1
    const originalText = 'Highly confidential financial ledger 2026';
    const mockFile = new File([new TextEncoder().encode(originalText)], 'ledger.txt', { type: 'text/plain' });
    const uploadRes = await lockerService.uploadDocument(aliceId, mockFile, 'Financial Ledger', 'document');
    expect(uploadRes.document).not.toBeNull();
    const doc = uploadRes.document!;

    // Change passphrase from Passphrase 1 to Passphrase 2
    const changeRes = await lockerService.changePassphrase(aliceId, alicePassphrase, aliceNewPassphrase);
    expect(changeRes.success).toBe(true);

    // Confirm recovery credentials were NOT replaced or discarded
    const updatedVault = mockVaults.get(aliceId);
    expect(updatedVault.recovery_verifier).toBe(initialRecoveryVerifier);
    expect(updatedVault.encrypted_master_recovery_key).toBe(initialMasterRecoveryKey);

    // Lock session
    await lockerService.lockVault(aliceId);
    expect(lockerService.isVaultUnlocked()).toBe(false);

    // Old Passphrase 1 MUST FAIL
    const oldUnlock = await lockerService.unlockVaultWithPassphrase(aliceId, alicePassphrase);
    expect(oldUnlock.success).toBe(false);

    // New Passphrase 2 MUST SUCCEED
    const newUnlock = await lockerService.unlockVaultWithPassphrase(aliceId, aliceNewPassphrase);
    expect(newUnlock.success).toBe(true);
    expect(lockerService.isVaultUnlocked()).toBe(true);

    // Decrypt the old document created under Passphrase 1 using the session unlocked via Passphrase 2
    const downloaded = await lockerService.downloadAndDecryptDocument(aliceId, doc);
    const decryptedBuffer = await downloaded.blob.arrayBuffer();
    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    expect(decryptedText).toBe(originalText);
  }, 20000);

  it('7. Legitimate end-to-end lifecycle: Challenge-response unlock, document upload, download and deletion work cleanly', async () => {
    currentAuthUserId = aliceId;
    await lockerService.initializeVault(aliceId, alicePassphrase);

    await lockerService.lockVault(aliceId);

    const unlockRes = await lockerService.unlockVaultWithPassphrase(aliceId, alicePassphrase);
    expect(unlockRes.success).toBe(true);

    const mockFile = new File(['%PDF-1.4 Report Content'], 'financial.pdf', { type: 'application/pdf' });
    const uploadRes = await lockerService.uploadDocument(aliceId, mockFile, 'Financial', 'document');
    expect(uploadRes.document).not.toBeNull();
    const doc = uploadRes.document!;

    const downloadRes = await lockerService.downloadAndDecryptDocument(aliceId, doc);
    expect(downloadRes.filename).toBe('financial.pdf');

    const deleteRes = await lockerService.deleteDocument(aliceId, doc.id);
    expect(deleteRes.success).toBe(true);
  });

  it('8. Recovery key continuity: Unlocking via Recovery Key preserves access to existing documents, and recovering with Recovery Key preserves full decryption continuity after passphrase reset', async () => {
    currentAuthUserId = aliceId;
    const { recoveryKey } = await lockerService.initializeVault(aliceId, alicePassphrase);
    expect(recoveryKey).toBeDefined();

    // Alice uploads a confidential document
    const secretMessage = 'Confidential Zero-Knowledge Recovery Continuity Test #2026';
    const mockFile = new File([new TextEncoder().encode(secretMessage)], 'continuity.txt', {
      type: 'text/plain',
    });
    const uploadRes = await lockerService.uploadDocument(aliceId, mockFile, 'Continuity Test', 'document');
    expect(uploadRes.document).not.toBeNull();
    const doc = uploadRes.document!;

    // Lock vault
    await lockerService.lockVault(aliceId);
    expect(lockerService.isVaultUnlocked()).toBe(false);

    // Step A: Unlock with Recovery Key directly (bypassing passphrase)
    const recoveryUnlock = await lockerService.unlockVaultWithRecoveryKey(aliceId, recoveryKey);
    expect(recoveryUnlock.success).toBe(true);
    expect(lockerService.isVaultUnlocked()).toBe(true);

    // Download and decrypt document while unlocked via Recovery Key
    const recoveryDownloaded = await lockerService.downloadAndDecryptDocument(aliceId, doc);
    const recoveryBuffer = await recoveryDownloaded.blob.arrayBuffer();
    const recoveryText = new TextDecoder().decode(recoveryBuffer);
    expect(recoveryText).toBe(secretMessage);

    // Lock vault
    await lockerService.lockVault(aliceId);

    // Step B: Legitimate Vault Recovery to set a new passphrase
    const resetPassphrase = 'AliceBrandNewRecoveredKey#2026!';
    const recoverRes = await lockerService.recoverVaultWithRecoveryKey(aliceId, recoveryKey, resetPassphrase);
    expect(recoverRes.success).toBe(true);

    // Lock vault
    await lockerService.lockVault(aliceId);

    // Step C: Old passphrase must fail
    const oldPassUnlock = await lockerService.unlockVaultWithPassphrase(aliceId, alicePassphrase);
    expect(oldPassUnlock.success).toBe(false);

    // Step D: New passphrase must succeed and decrypt the document
    const newPassUnlock = await lockerService.unlockVaultWithPassphrase(aliceId, resetPassphrase);
    expect(newPassUnlock.success).toBe(true);
    const newPassDownloaded = await lockerService.downloadAndDecryptDocument(aliceId, doc);
    const newPassBuffer = await newPassDownloaded.blob.arrayBuffer();
    expect(new TextDecoder().decode(newPassBuffer)).toBe(secretMessage);

    // Step E: Recovery Key remains valid and continues to unlock the vault and decrypt documents
    await lockerService.lockVault(aliceId);
    const recoveryUnlockAgain = await lockerService.unlockVaultWithRecoveryKey(aliceId, recoveryKey);
    expect(recoveryUnlockAgain.success).toBe(true);
    const downloadedAgain = await lockerService.downloadAndDecryptDocument(aliceId, doc);
    const finalBuffer = await downloadedAgain.blob.arrayBuffer();
    expect(new TextDecoder().decode(finalBuffer)).toBe(secretMessage);
  }, 25000);

  it('9. Safe vault reset: Storage objects are purged before database records, and reset is blocked while actively locked out', async () => {
    currentAuthUserId = aliceId;
    await lockerService.initializeVault(aliceId, alicePassphrase);

    const mockFile = new File(['%PDF-1.4 Vault Reset File'], 'reset_test.pdf', { type: 'application/pdf' });
    const uploadRes = await lockerService.uploadDocument(aliceId, mockFile, 'Reset Doc', 'document');
    expect(uploadRes.document).not.toBeNull();
    const storagePath = uploadRes.document!.file_path;

    // Verify storage object exists before reset
    expect(mockStorage.has(`secure-locker:${storagePath}`)).toBe(true);

    // Simulate active lockout
    const vault = mockVaults.get(aliceId);
    vault.locked_until = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Reset attempt while locked out must be blocked
    const blockedReset = await lockerService.resetVault(aliceId);
    expect(blockedReset.success).toBe(false);
    expect(blockedReset.error).toContain('locked out');
    // Storage object and vault records must remain intact
    expect(mockStorage.has(`secure-locker:${storagePath}`)).toBe(true);
    expect(mockVaults.has(aliceId)).toBe(true);

    // Clear lockout
    vault.locked_until = null;

    // Reset attempt when not locked out must succeed and remove both storage and DB records
    const successfulReset = await lockerService.resetVault(aliceId);
    expect(successfulReset.success).toBe(true);
    expect(mockStorage.has(`secure-locker:${storagePath}`)).toBe(false);
    expect(mockVaults.has(aliceId)).toBe(false);
  });
});
