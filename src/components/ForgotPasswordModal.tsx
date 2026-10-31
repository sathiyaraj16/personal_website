import React, { useState, useEffect } from 'react';
import { Mail, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, initialEmail]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!isConfigured) {
      setError('Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
      return;
    }

    setIsSubmitting(true);
    const { error: resetErr } = await resetPassword(email.trim());
    setIsSubmitting(false);

    if (resetErr) {
      setError(resetErr.message || 'Failed to send password reset email. Please try again.');
    } else {
      setSuccess(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
    >
      <div
        className="w-full max-w-md rounded-xl bg-[#10223D] border border-[rgba(169,186,212,0.2)] shadow-2xl p-6 relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#A9BAD4] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#75A7FF]">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 id="forgot-password-title" className="text-lg font-bold text-white tracking-tight">
              Reset your password
            </h3>
            <p className="text-xs text-[#A9BAD4]">
              Enter your work email and we'll send you recovery instructions.
            </p>
          </div>
        </div>

        {success ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-emerald-300">Recovery link sent!</p>
                <p className="text-emerald-200/90 leading-relaxed">
                  If an account exists for <strong className="text-white">{email}</strong>, you will receive an email with a secure link to reset your password.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="reset-email"
                className="block text-xs uppercase tracking-wider font-semibold text-[#A9BAD4]"
              >
                Work Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@company.com"
                  autoFocus
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-white text-[#172B4D] placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-shadow shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-[#A9BAD4] hover:text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-900/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
