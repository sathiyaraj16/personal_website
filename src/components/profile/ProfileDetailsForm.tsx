import React, { useState, useEffect } from 'react';
import { UserProfile, ProfileValidationErrors } from '../../types/profile';
import { AvatarUploader } from './AvatarUploader';
import { profileService } from '../../services/profileService';
import {
  User,
  Mail,
  Phone,
  FileText,
  Lock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ProfileDetailsFormProps {
  profile: UserProfile;
  onProfileUpdated: (updatedProfile: UserProfile) => void;
}

export const ProfileDetailsForm: React.FC<ProfileDetailsFormProps> = ({
  profile,
  onProfileUpdated,
}) => {
  // Form fields
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl);

  // Status states
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Sync state if profile prop changes
  useEffect(() => {
    setDisplayName(profile.displayName || '');
    setFullName(profile.fullName || '');
    setPhoneNumber(profile.phoneNumber || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  // Dirty state calculation
  const isDirty =
    displayName !== (profile.displayName || '') ||
    fullName !== (profile.fullName || '') ||
    phoneNumber !== (profile.phoneNumber || '') ||
    bio !== (profile.bio || '') ||
    avatarUrl !== profile.avatarUrl;

  const validate = (): boolean => {
    const newErrors: ProfileValidationErrors = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display Name is required.';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Display Name must be at least 2 characters.';
    }

    if (phoneNumber && phoneNumber.trim().length > 25) {
      newErrors.phoneNumber = 'Phone number is too long (max 25 characters).';
    }

    if (bio && bio.length > 500) {
      newErrors.bio = 'Bio cannot exceed 500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    setDisplayName(profile.displayName || '');
    setFullName(profile.fullName || '');
    setPhoneNumber(profile.phoneNumber || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatarUrl);
    setErrors({});
    setSuccessMessage(null);
    setGeneralError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSaving(true);

    try {
      const updates = {
        displayName: displayName.trim(),
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        avatarUrl,
      };

      const { error } = await profileService.updateProfile(profile.id, updates);

      if (error) {
        setGeneralError(error.message);
      } else {
        const updated: UserProfile = {
          ...profile,
          ...updates,
        };
        onProfileUpdated(updated);
        setSuccessMessage('Profile information saved successfully.');
        // Auto-dismiss success notification after 4s
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch {
      setGeneralError('An unexpected error occurred while saving your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#112541] rounded-2xl border border-[#263F63] p-6 sm:p-8 shadow-xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#263F63] gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-[#75A7FF]" />
            Personal Information
          </h2>
          <p className="text-xs text-[#A9BAD4]">
            Update your public persona, contact information, and avatar
          </p>
        </div>

        {/* Unsaved changes indicator */}
        {isDirty && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 text-[11px] font-semibold text-amber-300 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Unsaved changes
          </div>
        )}
      </div>

      {/* Avatar Uploader Component */}
      <div>
        <label className="block text-xs font-semibold text-[#A9BAD4] uppercase tracking-wider mb-2">
          Profile Photo
        </label>
        <AvatarUploader
          userId={profile.id}
          currentAvatarUrl={avatarUrl}
          displayName={displayName || profile.email}
          onAvatarChange={(newUrl) => setAvatarUrl(newUrl)}
        />
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="displayName"
              className="block text-xs font-semibold text-[#F8FAFC] flex items-center justify-between"
            >
              <span>Display Name *</span>
              <span className="text-[11px] text-[#A9BAD4] font-normal">Workspace handle</span>
            </label>
            <div className="relative">
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (errors.displayName) setErrors({ ...errors, displayName: undefined });
                }}
                placeholder="e.g. Alex Morgan"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#162D4D] border text-sm text-[#F8FAFC] placeholder-[#A9BAD4]/40 focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 transition-all ${
                  errors.displayName ? 'border-red-500' : 'border-[#263F63] focus:border-[#75A7FF]'
                }`}
              />
            </div>
            {errors.displayName && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.displayName}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="block text-xs font-semibold text-[#F8FAFC]">
              Full Legal Name
            </label>
            <div className="relative">
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alexandra Morgan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-sm text-[#F8FAFC] placeholder-[#A9BAD4]/40 focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 focus:border-[#75A7FF] transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Email Address (Read-only / Authenticated) */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-[#F8FAFC] flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#75A7FF]" />
                Email Address
              </span>
              <span className="text-[11px] text-[#A9BAD4] flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#A9BAD4]" />
                Auth Verified
              </span>
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426]/70 border border-[#263F63] text-sm text-[#A9BAD4] cursor-not-allowed font-mono opacity-80"
              />
            </div>
            <p className="text-[11px] text-[#A9BAD4]">
              Primary email is managed by Supabase Authentication and cannot be changed here.
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#75A7FF]" />
              Phone Number
            </label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined });
                }}
                placeholder="+1 (555) 000-0000"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#162D4D] border text-sm text-[#F8FAFC] placeholder-[#A9BAD4]/40 focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 transition-all ${
                  errors.phoneNumber ? 'border-red-500' : 'border-[#263F63] focus:border-[#75A7FF]'
                }`}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* Bio / Role Summary */}
        <div className="space-y-1.5">
          <label htmlFor="bio" className="block text-xs font-semibold text-[#F8FAFC] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#75A7FF]" />
              Bio & Role Description
            </span>
            <span className="text-[11px] text-[#A9BAD4] font-mono">
              {bio.length} / 500
            </span>
          </label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            maxLength={500}
            onChange={(e) => {
              setBio(e.target.value);
              if (errors.bio) setErrors({ ...errors, bio: undefined });
            }}
            placeholder="Tell your team about your background, responsibilities, or working hours..."
            className={`w-full px-3.5 py-2.5 rounded-xl bg-[#162D4D] border text-sm text-[#F8FAFC] placeholder-[#A9BAD4]/40 focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 transition-all resize-none ${
              errors.bio ? 'border-red-500' : 'border-[#263F63] focus:border-[#75A7FF]'
            }`}
          />
          {errors.bio && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.bio}
            </p>
          )}
        </div>

        {/* Feedback Banners */}
        {generalError && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#263F63]">
          <button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] border border-[#263F63] text-xs font-semibold text-[#A9BAD4] hover:text-[#F8FAFC] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-xs font-semibold text-white flex items-center gap-2 shadow-lg shadow-[#3B82F6]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
