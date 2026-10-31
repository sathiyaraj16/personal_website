import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  UserProfile,
  UserPreferences,
  ProfileUpdateData,
  DEFAULT_PREFERENCES,
} from '../types/profile';

const PREFERENCES_STORAGE_KEY_PREFIX = 'nexa_workspace_pref_';

function getLocalPreferencesKey(userId: string): string {
  return `${PREFERENCES_STORAGE_KEY_PREFIX}${userId}`;
}

function loadLocalPreferences(userId: string): UserPreferences {
  try {
    const raw = localStorage.getItem(getLocalPreferencesKey(userId));
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to parse local preferences:', e);
  }
  return DEFAULT_PREFERENCES;
}

function saveLocalPreferences(userId: string, prefs: UserPreferences): void {
  try {
    localStorage.setItem(getLocalPreferencesKey(userId), JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save local preferences:', e);
  }
}

export const profileService = {
  /**
   * Retrieves user profile by combining Supabase auth metadata and profiles table if present
   */
  async getUserProfile(user: User): Promise<{ profile: UserProfile; error: Error | null }> {
    const localPrefs = loadLocalPreferences(user.id);
    const userMeta = user.user_metadata || {};
    const appMeta = user.app_metadata || {};

    const defaultProfile: UserProfile = {
      id: user.id,
      email: user.email || '',
      displayName:
        userMeta.display_name ||
        userMeta.name ||
        userMeta.full_name ||
        user.email?.split('@')[0] ||
        'NEXA Operator',
      fullName: userMeta.full_name || userMeta.name || '',
      phoneNumber: userMeta.phone_number || user.phone || '',
      bio: userMeta.bio || '',
      avatarUrl: userMeta.avatar_url || userMeta.picture || null,
      provider: appMeta.provider || (user.app_metadata?.providers?.[0] ?? 'email'),
      emailConfirmed: Boolean(user.email_confirmed_at),
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at || null,
      role: (userMeta.role as string) || 'Authorized User',
      status: 'active',
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...(userMeta.preferences || {}),
        ...localPrefs,
      },
    };

    if (!isSupabaseConfigured) {
      return { profile: defaultProfile, error: null };
    }

    try {
      // Query profiles table if it exists
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        // Table may not exist yet in user's Supabase instance; fallback seamlessly to metadata
        return { profile: defaultProfile, error: null };
      }

      if (data) {
        const profile: UserProfile = {
          ...defaultProfile,
          displayName: data.display_name || defaultProfile.displayName,
          fullName: data.full_name || defaultProfile.fullName,
          phoneNumber: data.phone_number || defaultProfile.phoneNumber,
          bio: data.bio || defaultProfile.bio,
          avatarUrl: data.avatar_url || defaultProfile.avatarUrl,
          preferences: {
            ...defaultProfile.preferences,
            ...(data.preferences || {}),
          },
        };
        return { profile, error: null };
      }

      return { profile: defaultProfile, error: null };
    } catch {
      return { profile: defaultProfile, error: null };
    }
  },

  /**
   * Updates profile information in Supabase user metadata and profiles table
   */
  async updateProfile(
    userId: string,
    updates: ProfileUpdateData
  ): Promise<{ error: Error | null }> {
    try {
      // 1. Update Supabase Auth user metadata
      if (isSupabaseConfigured) {
        const metaUpdate: Record<string, unknown> = {};
        if (updates.displayName !== undefined) metaUpdate.display_name = updates.displayName;
        if (updates.fullName !== undefined) metaUpdate.full_name = updates.fullName;
        if (updates.phoneNumber !== undefined) metaUpdate.phone_number = updates.phoneNumber;
        if (updates.bio !== undefined) metaUpdate.bio = updates.bio;
        if (updates.avatarUrl !== undefined) metaUpdate.avatar_url = updates.avatarUrl;
        if (updates.preferences !== undefined) metaUpdate.preferences = updates.preferences;

        const { error: authError } = await supabase.auth.updateUser({
          data: metaUpdate,
        });

        if (authError) {
          console.warn('Supabase auth metadata update warning:', authError.message);
        }

        // 2. Also try updating profiles table if it exists
        try {
          await supabase.from('profiles').upsert({
            id: userId,
            ...(updates.displayName !== undefined ? { display_name: updates.displayName } : {}),
            ...(updates.fullName !== undefined ? { full_name: updates.fullName } : {}),
            ...(updates.phoneNumber !== undefined ? { phone_number: updates.phoneNumber } : {}),
            ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
            ...(updates.avatarUrl !== undefined ? { avatar_url: updates.avatarUrl } : {}),
            ...(updates.preferences !== undefined ? { preferences: updates.preferences } : {}),
            updated_at: new Date().toISOString(),
          });
        } catch {
          // Ignore if table does not exist
        }
      }

      // 3. Persist preferences locally for instant recovery
      if (updates.preferences) {
        const current = loadLocalPreferences(userId);
        saveLocalPreferences(userId, { ...current, ...updates.preferences });
      }

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Failed to update profile information.'),
      };
    }
  },

  /**
   * Upload an avatar image file to Supabase Storage or convert to data URL fallback
   */
  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<{ url: string | null; error: Error | null; fallback: boolean }> {
    // Client-side file size and type validation
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        url: null,
        error: new Error('Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.'),
        fallback: false,
      };
    }

    if (file.size > MAX_SIZE_BYTES) {
      return {
        url: null,
        error: new Error('File size exceeds the 5MB maximum limit.'),
        fallback: false,
      };
    }

    // Helper: generate Data URL fallback
    const generateDataUrl = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });
    };

    if (!isSupabaseConfigured) {
      const dataUrl = await generateDataUrl();
      return { url: dataUrl, error: null, fallback: true };
    }

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // If Supabase avatars bucket is not yet provisioned, fall back seamlessly to data URL
        console.warn('Supabase storage upload error, using local fallback:', uploadError.message);
        const dataUrl = await generateDataUrl();
        return { url: dataUrl, error: null, fallback: true };
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return { url: data.publicUrl, error: null, fallback: false };
    } catch {
      const dataUrl = await generateDataUrl();
      return { url: dataUrl, error: null, fallback: true };
    }
  },

  /**
   * Update password for email/password authenticated users
   */
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return {
        error: new Error('Supabase is not configured to perform password changes.'),
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Failed to update password.'),
      };
    }
  },

  /**
   * Save workspace preferences
   */
  async updatePreferences(
    userId: string,
    prefs: UserPreferences
  ): Promise<{ error: Error | null }> {
    saveLocalPreferences(userId, prefs);
    return await this.updateProfile(userId, { preferences: prefs });
  },
};
