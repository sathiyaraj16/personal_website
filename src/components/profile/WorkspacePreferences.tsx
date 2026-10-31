import React, { useState } from 'react';
import {
  UserProfile,
  UserPreferences,
  DateFormatPreference,
  TimeFormatPreference,
} from '../../types/profile';
import { usePreferences } from '../../context/PreferencesContext';
import {
  Sliders,
  Columns3,
  List,
  Calendar,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Info,
} from 'lucide-react';

interface WorkspacePreferencesProps {
  profile: UserProfile;
  onPreferencesUpdated?: (prefs: UserPreferences) => void;
}

export const WorkspacePreferences: React.FC<WorkspacePreferencesProps> = ({
  onPreferencesUpdated,
}) => {
  const {
    preferences,
    setDefaultTaskView,
    setDateFormat,
    setTimeFormat,
    setNotificationPreference,
    savePreferences,
    isSaving,
    formatDate,
    formatTime,
  } = usePreferences();

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const { error } = await savePreferences();
      if (error) {
        setSaveError(error.message);
      } else {
        setSaveSuccess(true);
        if (onPreferencesUpdated) {
          onPreferencesUpdated(preferences);
        }
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch {
      setSaveError('An unexpected error occurred while saving your preferences.');
    }
  };

  const todayPreview = formatDate(new Date());
  const nowPreview = formatTime(
    `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`
  );

  return (
    <div className="bg-[#112541] rounded-2xl border border-[#263F63] p-6 sm:p-8 shadow-xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#263F63] gap-2">
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#75A7FF]" />
            Workspace Preferences
          </h2>
          <p className="text-xs text-[#A9BAD4]">
            Display formatting, default task view, and alert channels
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Preferences Saved to Profile
          </span>
        )}
      </div>

      {saveError && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-2.5 text-xs text-red-200 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TASK VIEW, DATE & TIME FORMATS                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Default Task View */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
            <Columns3 className="w-3.5 h-3.5 text-[#75A7FF]" />
            Default To-Do View
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDefaultTaskView('kanban')}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                preferences.defaultTaskView === 'kanban'
                  ? 'bg-[#1B365B] border-[#75A7FF] text-[#F8FAFC] shadow-sm ring-1 ring-[#75A7FF]/40'
                  : 'bg-[#162D4D]/50 border-[#263F63] text-[#A9BAD4] hover:text-white'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setDefaultTaskView('list')}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                preferences.defaultTaskView === 'list'
                  ? 'bg-[#1B365B] border-[#75A7FF] text-[#F8FAFC] shadow-sm ring-1 ring-[#75A7FF]/40'
                  : 'bg-[#162D4D]/50 border-[#263F63] text-[#A9BAD4] hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>
          <p className="text-[11px] text-[#A9BAD4]">
            Applied automatically when opening the Tasks module
          </p>
        </div>

        {/* Date Format */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#F8FAFC] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#75A7FF]" />
              Date Format
            </span>
            <span className="text-[11px] font-mono text-[#75A7FF]">
              Preview: {todayPreview}
            </span>
          </label>
          <select
            value={preferences.dateFormat}
            onChange={(e) => setDateFormat(e.target.value as DateFormatPreference)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs font-mono text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 transition-all cursor-pointer"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (Day First)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (Month First)</option>
          </select>
          <p className="text-[11px] text-[#A9BAD4]">
            Used across task deadlines and activity logs
          </p>
        </div>

        {/* Time Format */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#F8FAFC] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#75A7FF]" />
              Time Format
            </span>
            <span className="text-[11px] font-mono text-[#75A7FF]">
              Preview: {nowPreview}
            </span>
          </label>
          <select
            value={preferences.timeFormat}
            onChange={(e) => setTimeFormat(e.target.value as TimeFormatPreference)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs font-mono text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 transition-all cursor-pointer"
          >
            <option value="12h">12-Hour (09:30 AM / 02:30 PM)</option>
            <option value="24h">24-Hour (09:30 / 14:30)</option>
          </select>
          <p className="text-[11px] text-[#A9BAD4]">
            Formatted on task schedules and session timestamps
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NOTIFICATION PREFERENCES                                               */}
      {/* ========================================================================= */}
      <div className="pt-3 border-t border-[#263F63] space-y-3">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-[#75A7FF]" />
            Notification Channels & Alert Preferences
          </label>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#162D4D]/40 border border-[#263F63] text-xs text-[#A9BAD4]">
            <Info className="w-4 h-4 text-[#75A7FF] flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              These settings dictate your alert preferences. Notification delivery will trigger through these channels when external email and webhook dispatch services are enabled.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Deadline alerts */}
          <div className="p-4 rounded-xl bg-[#162D4D]/50 border border-[#263F63] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-[#F8FAFC]">Task Deadline Reminders</p>
                {preferences.emailNotifications ? (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.2 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-[#A9BAD4] bg-[#263F63]/40 px-2 py-0.2 rounded-full">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A9BAD4]">
                Alert notifications for pending tasks due within 24 hours
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferences.emailNotifications}
              onClick={() =>
                setNotificationPreference('emailNotifications', !preferences.emailNotifications)
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 ${
                preferences.emailNotifications ? 'bg-[#3B82F6]' : 'bg-[#263F63]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  preferences.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Weekly digest */}
          <div className="p-4 rounded-xl bg-[#162D4D]/50 border border-[#263F63] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-[#F8FAFC]">Weekly Productivity Digest</p>
                {preferences.weeklyDigest ? (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.2 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-[#A9BAD4] bg-[#263F63]/40 px-2 py-0.2 rounded-full">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A9BAD4]">
                Weekly summary of completed work, completion rates, and focus streaks
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferences.weeklyDigest}
              onClick={() =>
                setNotificationPreference('weeklyDigest', !preferences.weeklyDigest)
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 ${
                preferences.weeklyDigest ? 'bg-[#3B82F6]' : 'bg-[#263F63]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  preferences.weeklyDigest ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Security alerts */}
          <div className="p-4 rounded-xl bg-[#162D4D]/50 border border-[#263F63] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-[#F8FAFC]">Security Incident & Login Alerts</p>
                {preferences.securityAlerts ? (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.2 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-[#A9BAD4] bg-[#263F63]/40 px-2 py-0.2 rounded-full">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A9BAD4]">
                Immediate security dispatch if authentication occurs from a new device or IP
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferences.securityAlerts}
              onClick={() =>
                setNotificationPreference('securityAlerts', !preferences.securityAlerts)
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 ${
                preferences.securityAlerts ? 'bg-[#3B82F6]' : 'bg-[#263F63]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  preferences.securityAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SAVE PREFERENCES ACTION                                                */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pt-3 border-t border-[#263F63] flex-wrap gap-3">
        <span className="text-xs text-[#A9BAD4]">
          Preferences are automatically cached locally and synchronized with your Supabase account.
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-xs font-semibold text-white flex items-center gap-2 shadow-lg shadow-[#3B82F6]/25 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving Preferences...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Workspace Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};
