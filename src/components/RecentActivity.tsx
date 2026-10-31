import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useTasks } from '../context/TaskContext';
import { Shield, Key, UserCheck, Clock, Inbox, Sparkles, CheckCircle2, ListTodo } from 'lucide-react';

export const RecentActivity: React.FC = () => {
  const { user, session } = useAuth();
  const { tasks } = useTasks();
  const { formatDate, formatTime, formatDateTime } = usePreferences();

  // Extract real verifiable activity from live session and authenticated tasks
  const realActivities: Array<{
    id: string;
    title: string;
    time: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    iconBg: string;
    description: string;
  }> = [];

  // 1. Most recent task event if present
  if (tasks.length > 0) {
    const sortedTasks = [...tasks].sort(
      (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    );

    const latestTask = sortedTasks[0];
    if (latestTask.status === 'completed') {
      realActivities.push({
        id: `act-task-${latestTask.id}`,
        title: `Deliverable finished: ${latestTask.title}`,
        time: formatDate(latestTask.completed_at || latestTask.updated_at),
        icon: CheckCircle2,
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/15 border-emerald-500/30',
        description: `Marked as completed in ${latestTask.category || 'General'} category.`,
      });
    } else {
      realActivities.push({
        id: `act-task-${latestTask.id}`,
        title: `Active task: ${latestTask.title}`,
        time: formatDate(latestTask.created_at),
        icon: ListTodo,
        iconColor: 'text-[#75A7FF]',
        iconBg: 'bg-[#3B82F6]/15 border-[#3B82F6]/30',
        description: `Priority: ${latestTask.priority.toUpperCase()} • Due ${formatDate(latestTask.due_date)}.`,
      });
    }
  }

  // 2. Real authentication sign-in
  if (user?.last_sign_in_at) {
    const provider = user.app_metadata?.provider || 'credentials';
    realActivities.push({
      id: 'act-login',
      title: `Signed in via ${provider.toUpperCase()}`,
      time: formatDateTime(user.last_sign_in_at),
      icon: Key,
      iconColor: 'text-[#75A7FF]',
      iconBg: 'bg-[#3B82F6]/15 border-[#3B82F6]/30',
      description: `Active session authenticated successfully.`,
    });
  }

  // 3. Real Supabase session token
  if (session?.expires_at) {
    const expiresDate = new Date(session.expires_at * 1000);
    const expiresTimeString = `${expiresDate.getHours().toString().padStart(2, '0')}:${expiresDate.getMinutes().toString().padStart(2, '0')}`;
    realActivities.push({
      id: 'act-session',
      title: 'Session token active',
      time: 'Live session',
      icon: Shield,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      description: `Valid until ${formatTime(expiresTimeString)}.`,
    });
  }

  // 4. Real account creation
  if (user?.created_at && realActivities.length < 4) {
    realActivities.push({
      id: 'act-created',
      title: 'Workspace identity verified',
      time: formatDate(user.created_at),
      icon: UserCheck,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/15 border-purple-500/30',
      description: `User profile verified in Supabase auth database.`,
    });
  }

  return (
    <div className="rounded-2xl bg-[#112541] text-[#F8FAFC] p-6 sm:p-7 shadow-lg shadow-black/20 border border-[#263F63] flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-[#263F63]">
        <div>
          <h3 className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight">
            Recent Activity
          </h3>
          <p className="text-xs text-[#A9BAD4] mt-0.5">
            Verified session & task audit log.
          </p>
        </div>
        <span className="text-[11px] font-mono text-[#75A7FF] px-2.5 py-1 rounded-full bg-[#162D4D] border border-[#263F63]">
          Live Data Only
        </span>
      </div>

      {realActivities.length === 0 ? (
        /* Helpful Clean Empty State */
        <div className="py-12 flex flex-col items-center justify-center text-center text-[#A9BAD4]">
          <div className="w-12 h-12 rounded-2xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] mb-3">
            <Inbox className="w-6 h-6 text-[#7890B2]" />
          </div>
          <p className="text-sm font-semibold text-[#F8FAFC]">No activity logged yet</p>
          <p className="text-xs text-[#7890B2] max-w-xs mt-1 leading-relaxed">
            Authentication events and workspace deliverables will appear here as you interact with your account.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#263F63]/60 my-2">
          {realActivities.map((act) => {
            const Icon = act.icon;
            return (
              <div key={act.id} className="py-3.5 flex items-start gap-3.5 group">
                <div
                  className={`w-9 h-9 rounded-xl ${act.iconBg} border flex items-center justify-center flex-shrink-0 mt-0.5`}
                >
                  <Icon className={`w-4 h-4 ${act.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-[#F8FAFC] truncate">
                      {act.title}
                    </p>
                    <span className="text-[11px] font-mono text-[#7890B2] flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {act.time}
                    </span>
                  </div>
                  <p className="text-xs text-[#A9BAD4] mt-0.5 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-4 border-t border-[#263F63] flex items-center justify-between text-xs text-[#A9BAD4]">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#75A7FF]" />
          Authenticated activity stream
        </span>
        <span className="font-mono text-[11px] text-[#7890B2]">
          ID: {user?.id ? `${user.id.slice(0, 8)}...` : 'Anonymous'}
        </span>
      </div>
    </div>
  );
};
