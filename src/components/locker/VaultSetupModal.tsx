import React, { useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Lock,
} from 'lucide-react';
import { evaluatePassphraseStrength } from '../../services/crypto/lockerCrypto';
import { lockerService } from '../../services/lockerService';

interface VaultSetupModalProps {
  userId: string;
  onSetupComplete: () => void;
}

export const VaultSetupModal: React.FC<VaultSetupModalProps> = ({ userId, onSetupComplete }) => {
  const [step, setStep] = useState<'passphrase' | 'recoveryKey'>('passphrase');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Recovery Key State
  const [recoveryKey, setRecoveryKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);

  const strength = evaluatePassphraseStrength(passphrase);
  const passwordsMatch = passphrase.length > 0 && passphrase === confirmPassphrase;

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!strength.isValid) {
      setError('Please choose a passphrase that meets all cryptographic strength requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passphrases do not match.');
      return;
    }

    setIsInitializing(true);
    try {
      const result = await lockerService.initializeVault(userId, passphrase, autoLockMinutes);
      if (result.error || !result.recoveryKey) {
        setError(result.error || 'Failed to initialize cryptographic vault.');
      } else {
        setRecoveryKey(result.recoveryKey);
        setStep('recoveryKey');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cryptographic initialization failed.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleDownloadEmergencySheet = () => {
    const textContent = `======================================================================
NEXA SECURE LOCKER - ZERO-TRUST EMERGENCY RECOVERY SHEET
======================================================================
Generated: ${new Date().toUTCString()}
User ID:   ${userId}

YOUR 256-BIT EMERGENCY RECOVERY KEY:
${recoveryKey}

CRITICAL ZERO-KNOWLEDGE SECURITY ADVISORY:
- NEXA operates on strict Zero-Knowledge and Zero-Trust principles.
- Your documents are encrypted client-side using AES-256-GCM.
- NEXA administrators and server systems DO NOT possess your passphrase
  or your recovery key.
- If you forget your locker passphrase AND lose this recovery key,
  your encrypted documents CANNOT be recovered by anyone.
- Store this emergency recovery sheet in a secure physical vault or offline
  password manager.
======================================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexa-vault-recovery-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081426]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-[#112541] rounded-2xl border border-[#263F63] shadow-2xl p-6 sm:p-8 space-y-6 text-[#F8FAFC]">
        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif]">
                Initialize Secure Locker Vault
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#3B82F6]/20 text-[#75A7FF] border border-[#3B82F6]/40">
                AES-256-GCM
              </span>
            </div>
            <p className="text-xs text-[#A9BAD4] mt-1">
              Zero-Trust Envelope Encryption. Plaintext data is never stored or transmitted.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Create Master Passphrase */}
        {step === 'passphrase' && (
          <form onSubmit={handleInitialize} className="space-y-4">
            <div className="p-4 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs text-[#A9BAD4] space-y-2">
              <div className="flex items-center gap-2 text-[#75A7FF] font-semibold">
                <KeyRound className="w-4 h-4" />
                <span>Separate Locker Authentication</span>
              </div>
              <p>
                Your Secure Locker requires its own strong passphrase separate from your login password.
                This passphrase derives your client-side Key-Encryption Key (KEK) via PBKDF2-SHA512
                (600,000 iterations) and an Argon2id verifier.
              </p>
            </div>

            {/* Passphrase Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F8FAFC]">
                Locker Master Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter a strong locker passphrase..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-[#263F63] text-sm text-[#F8FAFC] placeholder-[#7890B2] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7890B2] hover:text-[#F8FAFC]"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Meter */}
              {passphrase.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A9BAD4]">Passphrase Strength</span>
                    <span
                      className={`font-semibold ${
                        strength.score >= 4
                          ? 'text-emerald-400'
                          : strength.score >= 2
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {strength.score >= 4 ? 'Very Strong' : strength.score >= 2 ? 'Moderate' : 'Weak'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#081426] rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 transition-all ${
                          level <= strength.score
                            ? strength.score >= 4
                              ? 'bg-emerald-400'
                              : strength.score >= 2
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                            : 'bg-[#263F63]'
                        }`}
                      />
                    ))}
                  </div>
                  {strength.feedback.length > 0 && (
                    <ul className="text-[11px] text-[#A9BAD4] space-y-0.5 pt-1 list-disc pl-4">
                      {strength.feedback.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Passphrase Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F8FAFC]">
                Confirm Master Passphrase
              </label>
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Re-enter your master passphrase..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-[#263F63] text-sm text-[#F8FAFC] placeholder-[#7890B2] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              />
              {confirmPassphrase.length > 0 && !passwordsMatch && (
                <p className="text-[11px] text-red-400">Passphrases do not match.</p>
              )}
            </div>

            {/* Inactivity Auto-Lock Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F8FAFC]">
                Automatic Inactivity Lock Timer
              </label>
              <select
                value={autoLockMinutes}
                onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-[#263F63] text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
              >
                <option value={5}>5 minutes of inactivity</option>
                <option value={15}>15 minutes of inactivity (Recommended)</option>
                <option value={30}>30 minutes of inactivity</option>
                <option value={60}>60 minutes of inactivity</option>
              </select>
              <p className="text-[11px] text-[#A9BAD4]">
                When inactivity expires, the in-memory KEK is permanently erased from RAM.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!strength.isValid || !passwordsMatch || isInitializing}
                className="w-full py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#1B365B] disabled:text-[#7890B2] disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deriving Cryptographic Keys (Argon2id + PBKDF2)...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Cryptographic Keys & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Emergency Recovery Key Confirmation */}
        {step === 'recoveryKey' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 space-y-1">
                <p className="font-semibold text-amber-300">
                  Critical: Save Your 256-Bit Emergency Recovery Key
                </p>
                <p>
                  This recovery key can unlock your vault if you ever forget your passphrase.
                  NEXA does not store your passphrase or this key. If both are lost, your encrypted
                  documents are permanently unrecoverable.
                </p>
              </div>
            </div>

            {/* Recovery Key Display Box */}
            <div className="p-4 rounded-xl bg-[#081426] border border-[#263F63] space-y-3">
              <div className="flex items-center justify-between text-xs text-[#A9BAD4]">
                <span>256-Bit Cryptographic Recovery Key</span>
                <span className="font-mono text-[10px] text-[#75A7FF]">32 Characters</span>
              </div>
              <div className="p-3 bg-[#112541] rounded-lg border border-[#263F63]/80 font-mono text-center tracking-wider text-sm sm:text-base font-bold text-[#75A7FF] select-all break-all">
                {recoveryKey}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] border border-[#263F63] text-xs font-semibold text-[#F8FAFC] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied to Clipboard' : 'Copy Recovery Key'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadEmergencySheet}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] border border-[#263F63] text-xs font-semibold text-[#F8FAFC] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Emergency Sheet</span>
                </button>
              </div>
            </div>

            {/* Mandatory Confirmation Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#162D4D]/50 border border-[#263F63] cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedSaved}
                onChange={(e) => setConfirmedSaved(e.target.checked)}
                className="mt-0.5 rounded border-[#263F63] text-[#3B82F6] focus:ring-[#3B82F6]"
              />
              <span className="text-xs text-[#F8FAFC]">
                I have securely saved my 256-bit Emergency Recovery Key and acknowledge that neither NEXA nor
                any third party can recover my vault if I lose both my passphrase and key.
              </span>
            </label>

            <button
              type="button"
              disabled={!confirmedSaved}
              onClick={onSetupComplete}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#1B365B] disabled:text-[#7890B2] disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Open Secure Locker Vault</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
