import React from 'react';
import { UserProfile } from '../../types/profile';
import { usePreferences } from '../../context/PreferencesContext';
import { ShieldCheck, Mail, Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface ProfileHeaderProps {
  profile: UserProfile;
  onOpenAvatarUpload?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onOpenAvatarUpload }) => {
  const { formatDate, formatDateTime } = usePreferences();

  const initials = (profile.fullName || profile.displayName || 'NX')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const formattedCreatedDate = profile.createdAt
    ? formatDate(profile.createdAt)
    : 'Oct 2026';

  const formattedLastSignIn = profile.lastSignInAt
    ? formatDateTime(profile.lastSignInAt)
    : 'Active now';

  const isGoogle = profile.provider === 'google';

  return (
    <div className="bg-[#112541] rounded-2xl border border-[#263F63] p-6 sm:p-8 shadow-xl relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-[#75A7FF]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Avatar & Identity Details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar Container */}
          <div className="relative group flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#162D4D] to-[#1B365B] border-2 border-[#75A7FF]/50 p-1 shadow-lg overflow-hidden flex items-center justify-center">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-[#3B82F6]/20 border border-[#3B82F6]/30 flex items-center justify-center text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#75A7FF]">
                  {initials}
                </div>
              )}
            </div>

            {/* Quick Upload Trigger overlay on hover */}
            {onOpenAvatarUpload && (
              <button
                type="button"
                onClick={onOpenAvatarUpload}
                aria-label="Change profile photo"
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold text-white cursor-pointer backdrop-blur-xs"
              >
                Change
              </button>
            )}

            {/* Active Status Badge Indicator */}
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#112541] flex items-center justify-center shadow-xs"
              title="Status: Active"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </span>
          </div>

          {/* User Text Info */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight">
                {profile.fullName || profile.displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#162D4D] text-[#75A7FF] border border-[#263F63] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
                {profile.role || 'Enterprise Operator'}
              </span>
            </div>

            <p className="text-sm text-[#A9BAD4] font-mono flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#75A7FF]" />
              <span>{profile.email}</span>
              {profile.emailConfirmed && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-medium bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.2 rounded-md">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              )}
            </p>

            {profile.bio && (
              <p className="text-xs text-[#A9BAD4] max-w-xl leading-relaxed line-clamp-2 pt-1">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Right: Security & Identity Badges */}
        <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-end justify-center gap-2.5 border-t md:border-t-0 md:border-l border-[#263F63] pt-4 md:pt-0 md:pl-6 text-xs text-[#A9BAD4]">
          {/* Provider Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#162D4D] border border-[#263F63]">
            <span className="text-[11px] text-[#A9BAD4]">Provider:</span>
            {isGoogle ? (
              <span className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                Google OAuth
              </span>
            ) : (
              <span className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#75A7FF]" />
                Email / Password
              </span>
            )}
          </div>

          {/* Account Creation Date */}
          <div className="flex items-center gap-1.5 text-xs text-[#A9BAD4]">
            <Calendar className="w-3.5 h-3.5 text-[#75A7FF]" />
            <span>Member since {formattedCreatedDate}</span>
          </div>

          {/* Last Sign-In */}
          <div className="flex items-center gap-1.5 text-xs text-[#A9BAD4]">
            <Clock className="w-3.5 h-3.5 text-[#75A7FF]" />
            <span>Last active: {formattedLastSignIn}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
