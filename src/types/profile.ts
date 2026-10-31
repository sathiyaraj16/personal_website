export type ThemePreference = 'dark' | 'light' | 'system';
export type TaskViewPreference = 'list' | 'kanban';
export type DateFormatPreference = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
export type TimeFormatPreference = '12h' | '24h';

export interface UserPreferences {
  theme: ThemePreference;
  defaultTaskView: TaskViewPreference;
  dateFormat: DateFormatPreference;
  timeFormat: TimeFormatPreference;
  emailNotifications: boolean;
  weeklyDigest: boolean;
  securityAlerts: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  defaultTaskView: 'kanban',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '12h',
  emailNotifications: true,
  weeklyDigest: true,
  securityAlerts: true,
};

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  fullName: string;
  phoneNumber: string;
  bio: string;
  avatarUrl: string | null;
  provider: 'google' | 'email' | string;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  role: string;
  status: 'active' | 'suspended';
  preferences: UserPreferences;
}

export interface ProfileUpdateData {
  displayName?: string;
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
  avatarUrl?: string | null;
  preferences?: Partial<UserPreferences>;
}

export interface ProfileValidationErrors {
  displayName?: string;
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
  general?: string;
}
