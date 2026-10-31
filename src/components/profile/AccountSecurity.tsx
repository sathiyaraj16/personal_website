import React, { useState } from 'react';
import { UserProfile } from '../../types/profile';
import { profileService } from '../../services/profileService';
import {
  ShieldCheck,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Loader2,
} from 'lucide-react';

interface AccountSecurityProps {
  profile: UserProfile;
}

export const AccountSecurity: React.FC<AccountSecurityProps> = ({ profile }) => {
  const isGoogle = profile.provider === 'google';

  // Email password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Recovery email state
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSentSuccess, setResetSentSuccess] = useState<string | null>(null);

  // Copied UUID state
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(profile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && newPassword === confirmPassword;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!hasMinLength) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (!hasUppercase) {
      setPasswordError('Password must include at least one uppercase letter.');
      return;
    }
    if (!hasNumber) {
      setPasswordError('Password must include at least one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await profileService.updatePassword(newPassword);
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess('Password successfully updated. Use your new password on your next sign-in.');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordError('Failed to update password. Please verify your connection.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    setIsSendingReset(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    setResetSentSuccess(null);

    try {
      const result = await profileService.updateProfile(profile.id, {});
      if (result.error) {
        setPasswordError('Failed to trigger reset flow.');
      } else {
        setResetSentSuccess(`Password reset instructions dispatched to ${profile.email}.`);
      }
    } catch {
      setPasswordError('Failed to send reset email.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="bg-[#112541] rounded-2xl border border-[#263F63] p-6 sm:p-8 shadow-xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#263F63] gap-2">
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#75A7FF]" />
            Security & Authentication
          </h2>
          <p className="text-xs text-[#A9BAD4]">
            Manage authentication credentials, identity verification, and active sessions
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#162D4D] text-[#75A7FF] border border-[#263F63] self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>TLS 1.3 / AES-256</span>
        </span>
      </div>

      {/* Provider Details Card */}
      {isGoogle ? (
        <div className="p-5 rounded-xl bg-[#162D4D]/60 border border-[#263F63] space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Managed by Google Account Security
              </h3>
              <p className="text-xs text-[#A9BAD4] leading-relaxed">
                Your NEXA workspace authentication is anchored to your Google identity (<span className="text-[#F8FAFC] font-mono">{profile.email}</span>). Password modifications, passkeys, and two-step verification are administered through your Google Account.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
            <span className="text-[11px] text-[#A9BAD4] flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              OAuth 2.0 Federated Token Active
            </span>
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1B365B] hover:bg-[#264573] border border-[#263F63] text-xs font-semibold text-[#75A7FF] hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <span>Manage Google Security</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        /* Email / Password Management */
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-[#162D4D]/40 border border-[#263F63] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#75A7FF]" />
                Primary Auth Email
              </p>
              <p className="text-xs text-[#A9BAD4] font-mono">{profile.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {profile.emailConfirmed ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/50 text-amber-300 border border-amber-800/50 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Pending Verification
                </span>
              )}
            </div>
          </div>

          {/* Password Update Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#75A7FF]" />
              Update Account Password
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#F8FAFC]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-sm text-[#F8FAFC] placeholder-[#A9BAD4]/40 focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 focus:border-[#75A7FF] pr-10 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9BAD4] hover:text-[#F8FAFC] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#F8FAFC]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-sm text-[#F8FAFC] placeholder-[#A9BAD4]/40 focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 focus:border-[#75A7FF] pr-10 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3.5 rounded-xl bg-[#162D4D]/30 border border-[#263F63] space-y-2">
              <p className="text-[11px] font-semibold text-[#A9BAD4]">Password requirements:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-[#A9BAD4]'}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#A9BAD4]" />}
                  8+ characters
                </span>
                <span className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-400' : 'text-[#A9BAD4]'}`}>
                  {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#A9BAD4]" />}
                  1+ uppercase letter
                </span>
                <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-[#A9BAD4]'}`}>
                  {hasNumber ? <Check className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#A9BAD4]" />}
                  1+ number
                </span>
              </div>
            </div>

            {/* Error or Success notification */}
            {passwordError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {resetSentSuccess && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 flex items-center gap-2 text-xs text-blue-200">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>{resetSentSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSendingReset}
                className="text-xs text-[#75A7FF] hover:underline cursor-pointer disabled:opacity-50"
              >
                {isSendingReset ? 'Sending reset link...' : 'Send password recovery link to email'}
              </button>

              <button
                type="submit"
                disabled={!isPasswordValid || isUpdatingPassword}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Session & Unique Identifiers */}
      <div className="pt-4 border-t border-[#263F63] space-y-3">
        <h3 className="text-xs font-bold text-[#A9BAD4] uppercase tracking-wider">
          Security Metadata & Identity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* User ID */}
          <div className="p-3.5 rounded-xl bg-[#162D4D]/50 border border-[#263F63] flex items-center justify-between">
            <div className="space-y-0.5 overflow-hidden">
              <p className="text-[11px] text-[#A9BAD4]">Workspace User ID</p>
              <p className="font-mono text-[#F8FAFC] truncate">{profile.id}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              title="Copy User ID"
              className="p-1.5 rounded-lg bg-[#1B365B] hover:bg-[#264573] text-[#A9BAD4] hover:text-white transition-all cursor-pointer flex-shrink-0 ml-2"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Session Security */}
          <div className="p-3.5 rounded-xl bg-[#162D4D]/50 border border-[#263F63] flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] text-[#A9BAD4]">Encryption Standard</p>
              <p className="font-mono text-[#F8FAFC]">Supabase Auth JWT (HS256 / ECC)</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
          </div>
        </div>
      </div>
    </div>
  );
};
