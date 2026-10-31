import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  UserPreferences,
  ThemePreference,
  TaskViewPreference,
  DateFormatPreference,
  TimeFormatPreference,
  DEFAULT_PREFERENCES,
} from '../types/profile';
import { useAuth } from './AuthContext';
import { profileService } from '../services/profileService';

const GLOBAL_PREFERENCES_KEY = 'nexa_global_preferences';

interface PreferencesContextType {
  preferences: UserPreferences;
  effectiveTheme: 'dark' | 'light';
  isSaving: boolean;
  setTheme: (theme: ThemePreference) => void;
  setDefaultTaskView: (view: TaskViewPreference) => void;
  setDateFormat: (format: DateFormatPreference) => void;
  setTimeFormat: (format: TimeFormatPreference) => void;
  setNotificationPreference: (
    key: 'emailNotifications' | 'weeklyDigest' | 'securityAlerts',
    value: boolean
  ) => void;
  savePreferences: (overridePrefs?: UserPreferences) => Promise<{ error: Error | null }>;
  formatDate: (dateInput: string | Date | null | undefined, customFormat?: DateFormatPreference) => string;
  formatTime: (timeInput: string | null | undefined, customFormat?: TimeFormatPreference) => string;
  formatDateTime: (isoOrDate: string | Date | null | undefined) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

function getInitialPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(GLOBAL_PREFERENCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure dark theme is always active
      return { ...DEFAULT_PREFERENCES, ...parsed, theme: 'dark' };
    }
  } catch (e) {
    console.warn('Failed to read preferences from localStorage:', e);
  }
  return DEFAULT_PREFERENCES;
}

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(getInitialPreferences);
  const [isSaving, setIsSaving] = useState(false);

  // Original Approved NEXA Dark Theme
  const effectiveTheme: 'dark' | 'light' = 'dark';

  // Synchronously apply theme attributes to <html>
  const applyThemeToDOM = useCallback(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    root.classList.remove('light');
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  }, []);

  // Update DOM on mount and ensure dark theme is enforced
  useEffect(() => {
    applyThemeToDOM();
  }, [applyThemeToDOM]);

  // Load authenticated user's preferences from Supabase when user profile is ready
  useEffect(() => {
    if (!user) return;

    profileService.getUserProfile(user).then(({ profile }) => {
      if (profile?.preferences) {
        setPreferences((prev) => {
          const merged = { ...prev, ...profile.preferences, theme: 'dark' as ThemePreference };
          localStorage.setItem(GLOBAL_PREFERENCES_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    });
  }, [user]);

  // Save to localStorage immediately on any preference state change
  const persistLocally = useCallback((updated: UserPreferences) => {
    try {
      localStorage.setItem(GLOBAL_PREFERENCES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, []);

  const setTheme = useCallback(
    (_theme: ThemePreference) => {
      setPreferences((prev) => {
        const next = { ...prev, theme: 'dark' as ThemePreference };
        persistLocally(next);
        applyThemeToDOM();
        return next;
      });
    },
    [persistLocally, applyThemeToDOM]
  );

  const setDefaultTaskView = useCallback(
    (defaultTaskView: TaskViewPreference) => {
      setPreferences((prev) => {
        const next = { ...prev, defaultTaskView };
        persistLocally(next);
        return next;
      });
    },
    [persistLocally]
  );

  const setDateFormat = useCallback(
    (dateFormat: DateFormatPreference) => {
      setPreferences((prev) => {
        const next = { ...prev, dateFormat };
        persistLocally(next);
        return next;
      });
    },
    [persistLocally]
  );

  const setTimeFormat = useCallback(
    (timeFormat: TimeFormatPreference) => {
      setPreferences((prev) => {
        const next = { ...prev, timeFormat };
        persistLocally(next);
        return next;
      });
    },
    [persistLocally]
  );

  const setNotificationPreference = useCallback(
    (key: 'emailNotifications' | 'weeklyDigest' | 'securityAlerts', value: boolean) => {
      setPreferences((prev) => {
        const next = { ...prev, [key]: value };
        persistLocally(next);
        return next;
      });
    },
    [persistLocally]
  );

  const savePreferences = useCallback(
    async (overridePrefs?: UserPreferences): Promise<{ error: Error | null }> => {
      const prefsToSave = overridePrefs || preferences;
      setIsSaving(true);
      persistLocally(prefsToSave);

      try {
        if (user) {
          const { error } = await profileService.updatePreferences(user.id, prefsToSave);
          if (error) {
            setIsSaving(false);
            return { error };
          }
        }
        setIsSaving(false);
        return { error: null };
      } catch (err) {
        setIsSaving(false);
        return {
          error: err instanceof Error ? err : new Error('Failed to save workspace preferences.'),
        };
      }
    },
    [preferences, user, persistLocally]
  );

  // Formatting utilities
  const formatDate = useCallback(
    (dateInput: string | Date | null | undefined, customFormat?: DateFormatPreference): string => {
      if (!dateInput) return '';

      const targetFormat = customFormat || preferences.dateFormat;
      let year: number;
      let month: number;
      let day: number;

      if (dateInput instanceof Date) {
        year = dateInput.getFullYear();
        month = dateInput.getMonth() + 1;
        day = dateInput.getDate();
      } else if (typeof dateInput === 'string') {
        const trimmed = dateInput.trim();
        // If string is YYYY-MM-DD
        const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (ymdMatch) {
          year = parseInt(ymdMatch[1], 10);
          month = parseInt(ymdMatch[2], 10);
          day = parseInt(ymdMatch[3], 10);
        } else {
          const parsed = new Date(trimmed);
          if (isNaN(parsed.getTime())) return trimmed;
          year = parsed.getFullYear();
          month = parsed.getMonth() + 1;
          day = parsed.getDate();
        }
      } else {
        return '';
      }

      const yyyy = year.toString();
      const mm = month.toString().padStart(2, '0');
      const dd = day.toString().padStart(2, '0');

      switch (targetFormat) {
        case 'DD/MM/YYYY':
          return `${dd}/${mm}/${yyyy}`;
        case 'MM/DD/YYYY':
          return `${mm}/${dd}/${yyyy}`;
        case 'YYYY-MM-DD':
        default:
          return `${yyyy}-${mm}-${dd}`;
      }
    },
    [preferences.dateFormat]
  );

  const formatTime = useCallback(
    (timeInput: string | null | undefined, customFormat?: TimeFormatPreference): string => {
      if (!timeInput) return '';
      const targetFormat = customFormat || preferences.timeFormat;
      const trimmed = timeInput.trim();

      let hours = 0;
      let minutes = 0;

      // Match 12-hour format e.g. "09:30 AM", "2:45 pm", "11:00PM"
      const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const meridiem = match12[3]?.toLowerCase();

        if (meridiem === 'pm' && h < 12) h += 12;
        if (meridiem === 'am' && h === 12) h = 0;

        hours = h;
        minutes = m;
      } else {
        // Fallback or ISO string
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          hours = parsed.getHours();
          minutes = parsed.getMinutes();
        } else {
          return trimmed;
        }
      }

      const mm = minutes.toString().padStart(2, '0');

      if (targetFormat === '24h') {
        const hh = hours.toString().padStart(2, '0');
        return `${hh}:${mm}`;
      } else {
        // 12-hour format
        const period = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 === 0 ? 12 : hours % 12;
        const hh = h12.toString().padStart(2, '0');
        return `${hh}:${mm} ${period}`;
      }
    },
    [preferences.timeFormat]
  );

  const formatDateTime = useCallback(
    (isoOrDate: string | Date | null | undefined): string => {
      if (!isoOrDate) return '';
      const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
      if (isNaN(d.getTime())) return String(isoOrDate);

      const datePart = formatDate(d);
      const timePart = formatTime(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      );
      return `${datePart} ${timePart}`;
    },
    [formatDate, formatTime]
  );

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        effectiveTheme,
        isSaving,
        setTheme,
        setDefaultTaskView,
        setDateFormat,
        setTimeFormat,
        setNotificationPreference,
        savePreferences,
        formatDate,
        formatTime,
        formatDateTime,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
