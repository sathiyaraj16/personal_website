import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, Loader2 } from 'lucide-react';

export const SignOutSection: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (e) {
      console.error('Sign out failed:', e);
      navigate('/login');
    } finally {
      setIsSigningOut(false);
      setShowModal(false);
    }
  };

  return (
    <div className="bg-[#112541] rounded-2xl border border-red-900/30 p-6 sm:p-8 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] text-red-200 tracking-tight flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-400" />
            Sign Out of NEXA
          </h2>
          <p className="text-xs text-[#A9BAD4] max-w-xl">
            Terminate your active Supabase session on this device. You will need your credentials or Google account to sign back in.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 text-xs font-semibold text-red-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#112541] rounded-2xl border border-red-800/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center flex-shrink-0 text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Confirm Sign Out
                </h3>
                <p className="text-xs text-[#A9BAD4] leading-relaxed">
                  Are you sure you want to end your session for <strong className="text-[#F8FAFC]">{user?.email}</strong>? Any unsaved edits will be discarded.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#263F63]">
              <button
                type="button"
                disabled={isSigningOut}
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] border border-[#263F63] text-xs font-semibold text-[#A9BAD4] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={handleConfirmSignOut}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Signing Out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    Yes, Sign Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
