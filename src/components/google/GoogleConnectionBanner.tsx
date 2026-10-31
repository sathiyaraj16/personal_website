import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LogOut,
  Key,
  ExternalLink,
  Info,
  X,
  RefreshCw,
} from 'lucide-react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';

interface GoogleConnectionBannerProps {
  requiredService?: 'photos' | 'drive' | 'both';
  className?: string;
}

export const GoogleConnectionBanner: React.FC<GoogleConnectionBannerProps> = ({
  requiredService = 'both',
  className = '',
}) => {
  const {
    account,
    isConnected,
    isLoading,
    error,
    isClientIdConfigured,
    isTokenExpired,
    connect,
    disconnect,
    clearError,
    connectWithManualToken,
  } = useGoogleAuth();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [manualTokenError, setManualTokenError] = useState<string | null>(null);
  const [submittingToken, setSubmittingToken] = useState(false);

  const serviceTitle =
    requiredService === 'photos'
      ? 'Google Photos'
      : requiredService === 'drive'
      ? 'Google Drive'
      : 'Google Workspace';

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) {
      setManualTokenError('Please enter a valid Google OAuth access token.');
      return;
    }
    setManualTokenError(null);
    setSubmittingToken(true);
    const success = await connectWithManualToken(manualTokenInput.trim());
    setSubmittingToken(false);
    if (success) {
      setManualTokenInput('');
      setShowConfigModal(false);
    } else {
      setManualTokenError('Unable to authenticate with this token. Check validity.');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Active Error / Cancellation Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start justify-between gap-3 text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-amber-300">
                Google Authorization Notice
              </p>
              <p className="text-xs text-amber-200/90 leading-relaxed">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Connection Status Card */}
      <div className="rounded-2xl bg-[#112541] border border-[#263F63] p-4 sm:p-5 shadow-lg relative overflow-hidden transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Identity / Service status */}
          <div className="flex items-center gap-3.5">
            {/* Google Logo / Avatar */}
            {isConnected && account?.picture ? (
              <img
                src={account.picture}
                alt={account.name}
                className="w-12 h-12 rounded-xl border border-[#263F63] object-cover shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center flex-shrink-0 shadow-inner">
                {/* Official Google G Logo */}
                <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
            )}

            {/* Info details */}
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm sm:text-base text-[#F8FAFC] truncate">
                  {isConnected ? account?.name : `${serviceTitle} Authorization`}
                </span>

                {/* Status Badges */}
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : isTokenExpired ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3" /> Token Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-[#A9BAD4] border border-[#263F63]">
                    Disconnected
                  </span>
                )}
              </div>

              <p className="text-xs text-[#A9BAD4] truncate">
                {isConnected
                  ? account?.email
                  : `Connect your official Google account to sync and access ${serviceTitle}.`}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={() => connect()}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-[#75A7FF] hover:text-[#F8FAFC] border border-[#263F63] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-60"
                  title="Refresh permissions or switch accounts"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={disconnect}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-60"
                  title="Disconnect Google account and clear tokens"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (isClientIdConfigured) {
                      connect();
                    } else {
                      setShowConfigModal(true);
                    }
                  }}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm flex items-center gap-2.5 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      {/* G Icon */}
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span>Connect Google Account</span>
                    </>
                  )}
                </button>

                {/* Setup & Developer Token options button */}
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="p-2.5 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] transition-colors cursor-pointer"
                  title="Google OAuth & Developer Configuration"
                  aria-label="OAuth Configuration Helper"
                >
                  <Key className="w-4 h-4 text-[#75A7FF]" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Security & Scopes Footnote */}
        <div className="mt-3.5 pt-3 border-t border-[#263F63]/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A9BAD4]">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict In-Memory Session Security (Zero token storage in localStorage)</span>
          </div>

          <div className="flex items-center gap-2 text-[#7890B2]">
            <span>Minimum scopes:</span>
            <span className="font-mono text-[#75A7FF]">
              {requiredService === 'photos'
                ? 'photospicker.readonly'
                : requiredService === 'drive'
                ? 'drive.readonly'
                : 'drive.readonly, photospicker.readonly'}
            </span>
          </div>
        </div>
      </div>

      {/* Google Cloud & Developer Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl bg-[#10223D] border border-[#263F63] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF]">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">
                    Google OAuth Configuration
                  </h3>
                  <p className="text-xs text-[#A9BAD4]">
                    Setup instructions & direct developer access for testing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#162D4D] text-[#A9BAD4] hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client ID Status */}
            <div className="p-3.5 rounded-xl bg-[#112541] border border-[#263F63] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Environment Variable:</span>
                <span
                  className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                    isClientIdConfigured
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isClientIdConfigured ? 'VITE_GOOGLE_CLIENT_ID Configured' : 'Missing VITE_GOOGLE_CLIENT_ID'}
                </span>
              </div>
              <p className="text-[#A9BAD4] leading-relaxed">
                To enable 1-click Google OAuth popup directly from your Google Cloud Project:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[#A9BAD4] font-mono text-[11px]">
                <li>Visit Google Cloud Console &gt; Credentials</li>
                <li>Create OAuth 2.0 Client ID (Web Application)</li>
                <li>Add Authorised JavaScript origins: <span className="text-[#75A7FF]">http://localhost:5173</span></li>
                <li>Set <span className="text-[#75A7FF]">VITE_GOOGLE_CLIENT_ID=your-client-id</span> in .env</li>
              </ol>
            </div>

            {/* Option B: Direct Developer Access Token (Testing / Immediate Live Queries) */}
            <form onSubmit={handleManualTokenSubmit} className="space-y-3 pt-2 border-t border-[#263F63]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#75A7FF]" /> Immediate Developer Token Input (Test Mode)
                </label>
                <a
                  href="https://developers.google.com/oauthplayground/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#75A7FF] hover:underline flex items-center gap-1"
                >
                  OAuth Playground <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-[#A9BAD4] leading-relaxed">
                You can obtain a temporary token from Google OAuth Playground with scopes{' '}
                <code className="text-[#75A7FF] font-mono">drive.readonly</code> &{' '}
                <code className="text-[#75A7FF] font-mono">photospicker.mediaitems.readonly</code> to test live Google APIs immediately.
              </p>

              <textarea
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                placeholder="ya29.a0AfH6SM..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-[#081426] border border-[#263F63] text-xs font-mono text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />

              {manualTokenError && (
                <p className="text-xs text-red-400 font-medium">{manualTokenError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingToken || !manualTokenInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingToken ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                    </>
                  ) : (
                    'Authenticate Token'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
