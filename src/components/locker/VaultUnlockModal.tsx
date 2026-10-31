import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { lockerService } from '../../services/lockerService';
import { LockerVaultRecord } from '../../types/locker';

interface VaultUnlockModalProps {
  userId: string;
  vault: LockerVaultRecord;
  onUnlocked: () => void;
  onVaultResetRequested?: () => void;
}

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({
  userId,
  vault,
  onUnlocked,
  onVaultResetRequested,
}) => {
  const [useRecoveryMode, setUseRecoveryMode] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);

  // Check if vault is locked out
  useEffect(() => {
    const checkLockout = () => {
      if (vault.locked_until) {
        const diffMs = new Date(vault.locked_until).getTime() - Date.now();
        if (diffMs > 0) {
          setLockoutRemainingSeconds(Math.ceil(diffMs / 1000));
        } else {
          setLockoutRemainingSeconds(0);
        }
      } else {
        setLockoutRemainingSeconds(0);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [vault.locked_until]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnlocking(true);

    try {
      if (useRecoveryMode) {
        const res = await lockerService.unlockVaultWithRecoveryKey(userId, recoveryKeyInput);
        if (res.success) {
          onUnlocked();
        } else {
          setError(res.error || 'Invalid recovery key.');
        }
      } else {
        const res = await lockerService.unlockVaultWithPassphrase(userId, passphrase);
        if (res.success) {
          onUnlocked();
        } else {
          setError(res.error || 'Incorrect locker passphrase.');
          if (typeof res.remainingAttempts === 'number') {
            setRemainingAttempts(res.remainingAttempts);
          }
          if (res.lockedUntil) {
            const diffMs = new Date(res.lockedUntil).getTime() - Date.now();
            setLockoutRemainingSeconds(Math.max(0, Math.ceil(diffMs / 1000)));
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock operation failed.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const isLockedOut = lockoutRemainingSeconds > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081426]/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#112541] rounded-2xl border border-[#263F63] shadow-2xl p-6 sm:p-8 space-y-6 text-[#F8FAFC]">
        {/* Header Icon */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF]">
            {isLockedOut ? (
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            ) : useRecoveryMode ? (
              <KeyRound className="w-6 h-6 text-amber-400" />
            ) : (
              <Lock className="w-6 h-6 text-[#75A7FF]" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif]">
              {useRecoveryMode ? 'Emergency Recovery Unlock' : 'Unlock Secure Locker'}
            </h2>
            <p className="text-xs text-[#A9BAD4] mt-0.5">
              {useRecoveryMode
                ? 'Enter your 256-bit emergency recovery key'
                : 'Enter your master passphrase to decrypt the vault'}
            </p>
          </div>
        </div>

        {/* Lockout Warning Banner */}
        {isLockedOut && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-rose-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Security Lockout Triggered</span>
            </div>
            <p>
              Too many consecutive failed attempts. Passphrase entry is temporarily suspended to protect against brute-force attacks.
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#A9BAD4]">Lockout expires in:</span>
              <span className="font-mono text-rose-300 font-bold">
                {Math.floor(lockoutRemainingSeconds / 60)}m {lockoutRemainingSeconds % 60}s
              </span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          {!useRecoveryMode ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#F8FAFC]">
                  Locker Passphrase
                </label>
                {remainingAttempts !== null && remainingAttempts > 0 && !isLockedOut && (
                  <span className="text-[11px] text-amber-400 font-medium">
                    {remainingAttempts} attempt(s) remaining
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter your master passphrase..."
                  disabled={isLockedOut || isUnlocking}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-[#263F63] text-sm text-[#F8FAFC] placeholder-[#7890B2] focus:outline-none focus:border-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  disabled={isLockedOut}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7890B2] hover:text-[#F8FAFC] disabled:opacity-50"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F8FAFC]">
                256-Bit Emergency Recovery Key
              </label>
              <input
                type="text"
                value={recoveryKeyInput}
                onChange={(e) => setRecoveryKeyInput(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-[#263F63] text-sm font-mono text-[#75A7FF] tracking-wider placeholder-[#7890B2] focus:outline-none focus:border-[#3B82F6]"
              />
              <p className="text-[11px] text-[#A9BAD4]">
                Paste the 32-character recovery key generated during vault setup.
              </p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={
                (!useRecoveryMode && isLockedOut) ||
                isUnlocking ||
                (!useRecoveryMode && !passphrase) ||
                (useRecoveryMode && !recoveryKeyInput.trim())
              }
              className="w-full py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#1B365B] disabled:text-[#7890B2] disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Cryptographic Authenticator...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{useRecoveryMode ? 'Unlock with Recovery Key' : 'Unlock Vault'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Toggle between Passphrase and Recovery Key */}
        <div className="pt-2 border-t border-[#263F63]/80 flex flex-col items-center gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setUseRecoveryMode(!useRecoveryMode);
              setError(null);
            }}
            className="text-[#75A7FF] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            {useRecoveryMode ? (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Return to Master Passphrase Login</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Forgot Passphrase? Use 256-Bit Recovery Key</span>
              </>
            )}
          </button>

          {onVaultResetRequested && (
            <button
              type="button"
              onClick={onVaultResetRequested}
              className="text-[#7890B2] hover:text-red-400 text-[11px] transition-colors cursor-pointer"
            >
              Lost both? Reset and purge encrypted vault
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
