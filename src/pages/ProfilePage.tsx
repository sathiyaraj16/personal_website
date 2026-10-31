import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserPreferences } from '../types/profile';
import { profileService } from '../services/profileService';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileDetailsForm } from '../components/profile/ProfileDetailsForm';
import { AccountSecurity } from '../components/profile/AccountSecurity';
import { ConnectedServices } from '../components/profile/ConnectedServices';
import { WorkspacePreferences } from '../components/profile/WorkspacePreferences';
import { SignOutSection } from '../components/profile/SignOutSection';
import {
  User,
  ShieldCheck,
  Link2,
  Sliders,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  Layers,
} from 'lucide-react';

type TabKey = 'all' | 'personal' | 'security' | 'integrations' | 'preferences';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { profile: userProfile, error: fetchError } = await profileService.getUserProfile(user);
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setProfile(userProfile);
      }
    } catch {
      setError('Failed to load user profile information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleProfileUpdated = (updated: UserProfile) => {
    setProfile(updated);
  };

  const handlePreferencesUpdated = (prefs: UserPreferences) => {
    if (profile) {
      setProfile({
        ...profile,
        preferences: prefs,
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="h-44 rounded-2xl bg-[#112541]/60 border border-[#263F63] animate-pulse flex items-center justify-center">
          <div className="flex items-center gap-3 text-xs text-[#75A7FF]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading user credentials and workspace profile...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 rounded-2xl bg-[#112541]/40 border border-[#263F63] animate-pulse" />
          <div className="h-96 rounded-2xl bg-[#112541]/40 border border-[#263F63] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="p-8 rounded-2xl bg-[#112541] border border-red-800/40 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/60 mx-auto flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F8FAFC]">Failed to Load Profile</h3>
          <p className="text-xs text-[#A9BAD4] max-w-md mx-auto">
            {error || 'Unable to retrieve authenticated profile details from Supabase.'}
          </p>
          <button
            type="button"
            onClick={fetchProfile}
            className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-xs font-semibold text-white inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#112541] border border-[#263F63] flex items-center justify-center text-[#75A7FF] shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight">
                Profile & Account Management
              </h2>
              <p className="text-xs text-[#A9BAD4]">
                Manage your identity, security credentials, integrations, and workspace preferences
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#112541] border border-[#263F63] text-xs font-mono text-[#75A7FF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Supabase Auth Active</span>
          </span>
        </div>
      </div>

      {/* 1. Profile Overview Header Card */}
      <ProfileHeader
        profile={profile}
        onOpenAvatarUpload={() => {
          setActiveTab('personal');
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }}
      />

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#263F63]">
        {[
          { key: 'all' as TabKey, label: 'All Settings', icon: Layers },
          { key: 'personal' as TabKey, label: 'Personal Info', icon: User },
          { key: 'security' as TabKey, label: 'Security & Auth', icon: ShieldCheck },
          { key: 'integrations' as TabKey, label: 'Connected Services', icon: Link2 },
          { key: 'preferences' as TabKey, label: 'Preferences', icon: Sliders },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          const Icon = tab.icon;

          // Original NEXA Dark Theme Profile Navigation Tabs
          const tabClasses = isSelected
            ? 'bg-[#1B365B] text-[#F8FAFC] border-[#75A7FF]/60 shadow-xs font-semibold'
            : 'bg-transparent text-[#A9BAD4] border-transparent hover:bg-[#112541] hover:text-[#F8FAFC] font-medium';

          const iconClasses = isSelected ? 'text-white' : 'text-[#75A7FF]';

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-2 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${tabClasses}`}
            >
              <Icon className={`w-3.5 h-3.5 transition-colors ${iconClasses}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Personal Details Form */}
        {(activeTab === 'all' || activeTab === 'personal') && (
          <ProfileDetailsForm
            profile={profile}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        {/* Security & Authentication */}
        {(activeTab === 'all' || activeTab === 'security') && (
          <AccountSecurity profile={profile} />
        )}

        {/* Connected Services (Google Drive & Photos) */}
        {(activeTab === 'all' || activeTab === 'integrations') && (
          <ConnectedServices />
        )}

        {/* Workspace Preferences */}
        {(activeTab === 'all' || activeTab === 'preferences') && (
          <WorkspacePreferences
            profile={profile}
            onPreferencesUpdated={handlePreferencesUpdated}
          />
        )}

        {/* Sign Out Card */}
        <SignOutSection />
      </div>
    </div>
  );
};
