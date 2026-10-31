import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { NexaLogo } from '../components/NexaLogo';
import { WorkspaceGraphic } from '../components/WorkspaceGraphic';
import { GoogleButton } from '../components/GoogleButton';
import { LoginForm } from '../components/LoginForm';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { ConfigStatusBanner } from '../components/ConfigStatusBanner';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  X,
  Radio,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    user,
    loading,
    signInWithGoogle,
    oauthError,
    clearOAuthError,
    configMessage,
    isConfigured,
  } = useAuth();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // If already authenticated, redirect directly to the main dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setIsGoogleLoading(false);
    }
    // If successful and redirected, browser navigates to Google
  };

  return (
    <div className="relative min-h-screen w-full bg-[#081426] text-white flex flex-col justify-between overflow-x-hidden selection:bg-[#2563EB] selection:text-white font-['Inter',sans-serif]">
      {/* Background Atmospheric Radial Gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(37,99,235,0.18),rgba(8,20,38,0))]"
        aria-hidden="true"
      />

      {/* Top Application Bar */}
      <header className="relative z-10 w-full px-4 sm:px-6 lg:px-10 pt-5 sm:pt-6 flex items-center justify-between">
        <NexaLogo showTag={true} />

        <div className="flex items-center gap-2 text-xs text-[#A9BAD4] font-mono tracking-wider bg-[#10223D]/60 border border-[rgba(169,186,212,0.16)] px-3 py-1.5 rounded-full backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#75A7FF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]"></span>
          </span>
          <span className="hidden sm:inline">NODE 01 ACTIVE</span>
          <span className="sm:hidden">ACTIVE</span>
        </div>
      </header>

      {/* Main Central Container */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Configuration Notice Banner (if Supabase credentials are missing) */}
        {!isConfigured && <ConfigStatusBanner message={configMessage} />}

        {/* OAuth Error Alert Banner */}
        {oauthError && (
          <div
            role="alert"
            className="w-full max-w-[1040px] mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 flex items-start justify-between gap-3 shadow-lg shadow-black/20 animate-in fade-in duration-200"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white text-sm">Google Authentication Notice</p>
                <p className="text-xs text-red-200/90 mt-0.5 leading-relaxed">{oauthError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearOAuthError}
              aria-label="Dismiss error"
              className="text-red-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Two-Column Auth Panel */}
        <div className="w-full max-w-[1040px] grid grid-cols-1 lg:grid-cols-2 rounded-2xl shadow-2xl border border-[rgba(169,186,212,0.16)] overflow-hidden bg-[#10223D] transition-all duration-300">
          {/* ========================================================= */}
          {/* LEFT SIDE: Brand, Illustration & Google SSO              */}
          {/* ========================================================= */}
          <div className="relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-[#0d1a2f] border-b lg:border-b-0 lg:border-r border-[rgba(169,186,212,0.16)] overflow-hidden">
            {/* Subtle Tonal Backlight Orbs */}
            <div
              className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#2563EB]/15 blur-3xl pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#75A7FF]/10 blur-2xl pointer-events-none"
              aria-hidden="true"
            />

            {/* Left Header & Value Proposition */}
            <div className="relative z-10 flex flex-col gap-4">
              <NexaLogo size="md" />

              <div className="flex flex-col gap-2 mt-2">
                <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Welcome Back!
                </h1>
                <p className="text-sm sm:text-base text-[#FFFFFF] font-medium leading-relaxed">
                  Your personal workspace, all in one place.
                </p>
                <p className="text-xs sm:text-sm text-[#A9BAD4] leading-relaxed max-w-sm">
                  Streamline daily workflows, orchestrate projects, and stay in flow with unified intelligence.
                </p>
              </div>
            </div>

            {/* Center Decorative Illustration */}
            <div className="relative z-10 my-6 sm:my-8 flex items-center justify-center">
              <WorkspaceGraphic />
            </div>

            {/* Google Authentication Section & Security Assurance */}
            <div className="relative z-10 flex flex-col gap-3 pt-2">
              <GoogleButton
                onClick={handleGoogleSignIn}
                isLoading={isGoogleLoading}
              />

              <div className="flex items-center justify-center gap-1.5 text-xs text-[#A9BAD4] pt-1">
                <ShieldCheck className="w-4 h-4 text-[#75A7FF] flex-shrink-0" />
                <span className="text-[12px]">Secure sign-in. Your data stays protected.</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE: Email Authentication Form                    */}
          {/* ========================================================= */}
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-[#10223D]">
            <div className="flex flex-col">
              {/* Form Title & Subtitle */}
              <div className="flex flex-col mb-6">
                <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Sign in to your account
                </h2>
                <p className="text-xs sm:text-sm text-[#A9BAD4] mt-1">
                  Enter your credentials to continue.
                </p>
              </div>

              {/* Functional Email/Password Form */}
              <LoginForm
                onForgotPasswordClick={() => setIsForgotPasswordOpen(true)}
              />
            </div>

            {/* Trust, Encryption & Compliance Badges */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[rgba(169,186,212,0.12)] text-xs text-[#A9BAD4]">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#75A7FF]" />
                <span className="text-[11px] sm:text-xs font-medium">256-bit AES Encryption</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] sm:text-xs font-medium">SOC2 Type II Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-4 sm:px-6 lg:px-10 pb-5 sm:pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A9BAD4] font-mono">
        <div className="flex items-center gap-2">
          <span>© 2026 NEXA Systems Inc. Enterprise Vault</span>
          <span className="text-slate-600">•</span>
          <span className="text-[#75A7FF]">v4.12-sec</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-slate-500">FIPS 140-2 Level 3 Validated</span>
          <div className="flex items-center gap-1 text-[#75A7FF]">
            <Radio className="w-3 h-3 text-[#2563EB]" />
            <span>E2EE Active</span>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};
