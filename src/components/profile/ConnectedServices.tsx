import React, { useState } from 'react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { GOOGLE_SCOPES } from '../../services/googleAuthService';
import {
  Link2,
  HardDrive,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Unlink,
  Loader2,
  Info,
} from 'lucide-react';

export const ConnectedServices: React.FC = () => {
  const {
    account,
    isConnected,
    isLoading,
    error,
    hasScope,
    connect,
    disconnect,
    clearError,
    tokenExpiresAt,
  } = useGoogleAuth();

  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const hasDriveScope = hasScope(GOOGLE_SCOPES.DRIVE_READONLY);
  const hasPhotosScope = hasScope(GOOGLE_SCOPES.PHOTOS_PICKER);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnect();
      setShowConfirmDisconnect(false);
    } finally {
      setDisconnecting(false);
    }
  };

  const formattedExpiry = tokenExpiresAt
    ? new Date(tokenExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-[#112541] rounded-2xl border border-[#263F63] p-6 sm:p-8 shadow-xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#263F63] gap-2">
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#75A7FF]" />
            Connected Services & Integrations
          </h2>
          <p className="text-xs text-[#A9BAD4]">
            Manage external cloud storage and workspace authorizations
          </p>
        </div>

        <span className="text-xs font-mono text-[#A9BAD4]">
          {isConnected ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              1 Connected Service
            </span>
          ) : (
            <span className="text-[#A9BAD4]">0 Connected Services</span>
          )}
        </span>
      </div>

      {/* Security Note on Decoupled Auth */}
      <div className="p-3.5 rounded-xl bg-[#162D4D]/50 border border-[#263F63] flex items-start gap-3 text-xs text-[#A9BAD4]">
        <Info className="w-4 h-4 text-[#75A7FF] flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Google Drive and Photos permissions are authorized independently using official Google OAuth scopes. Disconnecting Google services does <strong className="text-[#F8FAFC]">not</strong> log you out of your NEXA workspace.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center justify-between gap-3 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-[11px] underline hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Google Cloud Integration Card */}
      <div className="p-5 rounded-xl bg-[#162D4D]/40 border border-[#263F63] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-xs">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F8FAFC]">Google Workspace Integration</h3>
                {isConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#263F63]/50 text-[#A9BAD4] border border-[#263F63]">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A9BAD4] mt-0.5">
                {isConnected && account
                  ? `Authorized as ${account.name} (${account.email})`
                  : 'Allows browsing files in Google Drive and photos in Google Photos'}
              </p>
            </div>
          </div>

          {/* Action Trigger */}
          <div>
            {isConnected ? (
              <button
                type="button"
                onClick={() => setShowConfirmDisconnect(true)}
                className="px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-xs font-semibold text-red-300 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => connect()}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    Connect Google Account
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Feature Sub-Scopes Status */}
        {isConnected && (
          <div className="pt-3 border-t border-[#263F63] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Drive Scope */}
            <div className="p-3 rounded-lg bg-[#112541] border border-[#263F63] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-[#75A7FF]" />
                <span className="font-semibold text-[#F8FAFC]">Google Drive</span>
              </div>
              {hasDriveScope ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Read-Only Active
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  Scope Pending
                </span>
              )}
            </div>

            {/* Photos Scope */}
            <div className="p-3 rounded-lg bg-[#112541] border border-[#263F63] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-[#75A7FF]" />
                <span className="font-semibold text-[#F8FAFC]">Google Photos</span>
              </div>
              {hasPhotosScope ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Picker API Active
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  Scope Pending
                </span>
              )}
            </div>
          </div>
        )}

        {isConnected && formattedExpiry && (
          <p className="text-[11px] text-[#A9BAD4] font-mono">
            Session token valid in browser until: {formattedExpiry}
          </p>
        )}
      </div>

      {/* Disconnect Confirmation Modal */}
      {showConfirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#112541] rounded-2xl border border-[#263F63] p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800/50 flex items-center justify-center flex-shrink-0 text-red-400">
                <Unlink className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Disconnect Google Workspace?
                </h3>
                <p className="text-xs text-[#A9BAD4] mt-1 leading-relaxed">
                  This will detach your Google Drive and Google Photos integrations. You will need to re-authenticate to view or pick files. Your NEXA workspace session will remain active.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#263F63]">
              <button
                type="button"
                disabled={disconnecting}
                onClick={() => setShowConfirmDisconnect(false)}
                className="px-4 py-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] border border-[#263F63] text-xs font-semibold text-[#A9BAD4] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disconnecting}
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Confirm Disconnect'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
