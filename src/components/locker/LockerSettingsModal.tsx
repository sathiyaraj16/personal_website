import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { lockerService } from '../../services/lockerService';
import { evaluatePassphraseStrength } from '../../services/crypto/lockerCrypto';

interface LockerSettingsModalProps {
  userId: string;
  onClose: () => void;
  onPassphraseChanged: () => void;
  onVaultReset: () => void;
}

export const LockerSettingsModal: React.FC<LockerSettingsModalProps> = ({
  userId,
  onClose,
  onPassphraseChanged,
  onVaultReset,
}) => {
  const [activeTab, setActiveTab] = useState<'passphrase' | 'recovery' | 'inactivity' | 'danger'>('passphrase');

  // Passphrase Change State
  const [currentPassphrase, setCurrentPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmNewPassphrase, setConfirmNewPassphrase] = useState('');
  const [isChangingPassphrase, setIsChangingPassphrase] = useState(false);
  const [passphraseSuccess, setPassphraseSuccess] = useState(false);
  const [passphraseError, setPassphraseError] = useState<string | null>(null);

  // Recovery Key Rotation State
  const [isRotatingRecoveryKey, setIsRotatingRecoveryKey] = useState(false);
  const [newRotatedRecoveryKey, setNewRotatedRecoveryKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Inactivity Timer State
  const [autoLockMinutes, setAutoLockMinutesState] = useState(lockerService.getAutoLockMinutes());
  const [timerSaved, setTimerSaved] = useState(false);

  // MFA & Recent Auth Status
  const [mfaStatus, setMfaStatus] = useState<boolean>(false);
  const [authFreshness, setAuthFreshness] = useState<{ isRecent: boolean; lastSignInAt: Date | null }>({
    isRecent: true,
    lastSignInAt: null,
  });

  // Danger Zone Reset State
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    lockerService.checkMfaStatus().then((res) => setMfaStatus(res.mfaEnabled));
    lockerService.checkRecentAuthentication().then((res) => setAuthFreshness(res));
  }, []);

  const strength = evaluatePassphraseStrength(newPassphrase);
  const passwordsMatch = newPassphrase.length > 0 && newPassphrase === confirmNewPassphrase;

  const handleChangePassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassphraseError(null);
    setPassphraseSuccess(false);

    if (!strength.isValid) {
      setPassphraseError('New passphrase must meet all cryptographic strength requirements.');
      return;
    }
    if (!passwordsMatch) {
      setPassphraseError('New passphrases do not match.');
      return;
    }

    setIsChangingPassphrase(true);
    try {
      const res = await lockerService.changePassphrase(userId, currentPassphrase, newPassphrase);
      if (!res.success) {
        setPassphraseError(res.error || 'Failed to update passphrase.');
      } else {
        setPassphraseSuccess(true);
        setCurrentPassphrase('');
        setNewPassphrase('');
        setConfirmNewPassphrase('');
        onPassphraseChanged();
        setTimeout(() => setPassphraseSuccess(false), 3000);
      }
    } catch (err) {
      setPassphraseError(err instanceof Error ? err.message : 'Passphrase change failed.');
    } finally {
      setIsChangingPassphrase(false);
    }
  };

  const handleRotateRecoveryKey = async () => {
    setRecoveryError(null);
    setIsRotatingRecoveryKey(true);
    try {
      const res = await lockerService.rotateRecoveryKey(userId);
      if (res.error || !res.recoveryKey) {
        setRecoveryError(res.error || 'Failed to rotate recovery key.');
      } else {
        setNewRotatedRecoveryKey(res.recoveryKey);
      }
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : 'Rotation failed.');
    } finally {
      setIsRotatingRecoveryKey(false);
    }
  };

  const handleSaveTimer = () => {
    lockerService.setAutoLockMinutes(autoLockMinutes);
    setTimerSaved(true);
    setTimeout(() => setTimerSaved(false), 2500);
  };

  const handleEmergencyReset = async () => {
    if (resetConfirmation !== 'RESET AND PURGE ALL ENCRYPTED DATA') {
      setResetError('Confirmation text does not match.');
      return;
    }

    setIsResetting(true);
    setResetError(null);
    try {
      const res = await lockerService.resetVault(userId);
      if (res.success) {
        onVaultReset();
        onClose();
      } else {
        setResetError(res.error || 'Reset failed.');
      }
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Reset error.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081426]/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#112541] rounded-2xl border border-[#263F63] shadow-2xl p-6 sm:p-8 space-y-6 text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#263F63]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif]">
                Security & Key Management
              </h3>
              <p className="text-xs text-[#A9BAD4]">
                Manage envelope keys, recovery tokens, and zero-knowledge configurations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#A9BAD4] hover:text-[#F8FAFC] hover:bg-[#162D4D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#263F63] pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('passphrase')}
            className={`px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
              activeTab === 'passphrase'
                ? 'bg-[#1B365B] text-[#F8FAFC] border border-[#75A7FF]/60'
                : 'text-[#A9BAD4] hover:text-[#F8FAFC] hover:bg-[#162D4D]'
            }`}
          >
            Change Passphrase
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            className={`px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
              activeTab === 'recovery'
                ? 'bg-[#1B365B] text-[#F8FAFC] border border-[#75A7FF]/60'
                : 'text-[#A9BAD4] hover:text-[#F8FAFC] hover:bg-[#162D4D]'
            }`}
          >
            Recovery Key
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inactivity')}
            className={`px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
              activeTab === 'inactivity'
                ? 'bg-[#1B365B] text-[#F8FAFC] border border-[#75A7FF]/60'
                : 'text-[#A9BAD4] hover:text-[#F8FAFC] hover:bg-[#162D4D]'
            }`}
          >
            Auto-Lock & Auth
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
              activeTab === 'danger'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/50'
                : 'text-[#A9BAD4] hover:text-rose-400 hover:bg-[#162D4D]'
            }`}
          >
            Danger Zone
          </button>
        </div>

        {/* Tab 1: Change Passphrase */}
        {activeTab === 'passphrase' && (
          <form onSubmit={handleChangePassphrase} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs text-[#A9BAD4]">
              Changing your master passphrase re-wraps all document Data Encryption Keys (DEKs) using a newly
              derived Key-Encryption Key (KEK) via PBKDF2-SHA512. Document ciphertexts do not need to be re-uploaded.
            </div>

            {passphraseSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Passphrase successfully updated! All document keys re-wrapped.</span>
              </div>
            )}

            {passphraseError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>{passphraseError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F8FAFC]">Current Locker Passphrase</label>
              <input
                type="password"
                value={currentPassphrase}
                onChange={(e) => setCurrentPassphrase(e.target.value)}
                placeholder="Enter your existing passphrase..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-[#263F63] text-sm text-[#F8FAFC] placeholder-[#7890B2] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F8FAFC]">New Locker Passphrase</label>
              <input
                type="password"
                value={newPassphrase}
                onChange={(e) => setNewPassphrase(e.target.value)}
                placeholder="Enter a new strong passphrase..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-[#263F63] text-sm text-[#F8FAFC] placeholder-[#7890B2] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F8FAFC]">Confirm New Passphrase</label>
              <input
                type="password"
                value={confirmNewPassphrase}
                onChange={(e) => setConfirmNewPassphrase(e.target.value)}
                placeholder="Confirm your new passphrase..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-[#263F63] text-sm text-[#F8FAFC] placeholder-[#7890B2] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <button
              type="submit"
              disabled={!strength.isValid || !passwordsMatch || isChangingPassphrase || !currentPassphrase}
              className="w-full py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#1B365B] disabled:text-[#7890B2] text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {isChangingPassphrase ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Re-wrapping Document Keys...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Rotate Key & Save New Passphrase</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Recovery Key Rotation */}
        {activeTab === 'recovery' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs text-[#A9BAD4] space-y-1">
              <p className="font-semibold text-[#75A7FF]">256-Bit Emergency Recovery Key Rotation</p>
              <p>
                If you suspect your emergency recovery key was compromised, you can rotate it immediately.
                A new 256-bit key will be derived and the old key will be permanently invalidated.
              </p>
            </div>

            {recoveryError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>{recoveryError}</span>
              </div>
            )}

            {newRotatedRecoveryKey ? (
              <div className="p-4 rounded-xl bg-[#081426] border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>New Recovery Key Generated</span>
                </div>
                <div className="p-3 bg-[#112541] rounded-lg border border-[#263F63] font-mono text-center tracking-wider text-sm font-bold text-[#75A7FF] select-all break-all">
                  {newRotatedRecoveryKey}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newRotatedRecoveryKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2500);
                  }}
                  className="w-full py-2 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] border border-[#263F63] text-xs font-semibold text-[#F8FAFC] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy New Recovery Key'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRotateRecoveryKey}
                disabled={isRotatingRecoveryKey}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-[#1B365B] text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isRotatingRecoveryKey ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rotating Recovery Key...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Generate & Rotate New Recovery Key</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Tab 3: Inactivity & MFA Status */}
        {activeTab === 'inactivity' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#F8FAFC]">Auto-Lock Inactivity Threshold</label>
              <select
                value={autoLockMinutes}
                onChange={(e) => setAutoLockMinutesState(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-[#263F63] text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes (Standard)</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
              <button
                type="button"
                onClick={handleSaveTimer}
                className="py-2 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {timerSaved ? 'Saved!' : 'Save Auto-Lock Setting'}
              </button>
            </div>

            <div className="pt-3 border-t border-[#263F63] space-y-3">
              <h4 className="text-xs font-semibold text-[#A9BAD4] uppercase tracking-wider">
                Identity & Session Security Checks
              </h4>
              <div className="p-3.5 rounded-xl bg-[#081426] border border-[#263F63] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#A9BAD4]">Multi-Factor Authentication (TOTP MFA)</span>
                  <span
                    className={`font-semibold ${
                      mfaStatus ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {mfaStatus ? 'Enforced (AAL2 Active)' : 'Optional (Configurable in Profile)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#A9BAD4]">Session Freshness</span>
                  <span className="text-emerald-400 font-semibold">
                    {authFreshness.isRecent ? 'Fresh Session Verified' : 'Re-authentication Advised'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Danger Zone Reset */}
        {activeTab === 'danger' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Irreversible Vault Purge</span>
              </div>
              <p>
                Resetting your vault permanently purges all encrypted documents, cryptographic salts, and
                verification hashes. Because NEXA does not possess your keys, this action cannot be undone.
              </p>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200">
                {resetError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F8FAFC]">
                Type <span className="font-mono text-rose-400">RESET AND PURGE ALL ENCRYPTED DATA</span> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="Type confirmation phrase..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-rose-500/40 text-sm font-mono text-rose-300 focus:outline-none focus:border-rose-400"
              />
            </div>

            <button
              type="button"
              onClick={handleEmergencyReset}
              disabled={resetConfirmation !== 'RESET AND PURGE ALL ENCRYPTED DATA' || isResetting}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-[#1B365B] disabled:text-[#7890B2] text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Purging Encrypted Data...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Purge Vault & Reset</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
