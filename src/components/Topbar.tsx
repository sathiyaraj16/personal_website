import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, Bell, Calendar as CalendarIcon, Check, Sparkles, Inbox } from 'lucide-react';
import { UserProfileMenu } from './UserProfileMenu';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
  pageTitle?: string;
  breadcrumb?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileSidebar,
  pageTitle = 'Dashboard',
  breadcrumb = 'Workspace',
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { tasks, stats } = useTasks();

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { formatDate } = usePreferences();
  const formattedDate = formatDate(new Date());

  // Real verifiable notifications derived from authenticated session and tasks
  const notifications = useMemo(() => {
    const list: Array<{ id: string; title: string; time: string; read: boolean }> = [];

    if (stats.overdue > 0) {
      list.push({
        id: 'notif-overdue',
        title: `${stats.overdue} deliverable${stats.overdue > 1 ? 's are' : ' is'} overdue and pending review`,
        time: 'Immediate',
        read: false,
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dueToday = tasks.filter((t) => t.due_date === todayStr && t.status !== 'completed').length;
    if (dueToday > 0) {
      list.push({
        id: 'notif-today',
        title: `${dueToday} deliverable${dueToday > 1 ? 's are' : ' is'} scheduled for completion today`,
        time: 'Today',
        read: false,
      });
    }

    if (user?.email) {
      list.push({
        id: 'notif-auth',
        title: `Supabase session active (${user.email})`,
        time: 'Verified',
        read: true,
      });
    }

    return list;
  }, [user, tasks, stats]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-20 bg-[#10223D] border-b border-[#263F63] px-4 sm:px-6 md:px-8 xl:px-10 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Left: Mobile Menu Toggle & Clear Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-[#112541] border border-[#263F63] text-[#A9BAD4] hover:text-[#F8FAFC] transition-colors cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#75A7FF] tracking-wide uppercase">
            <span>{breadcrumb}</span>
            <span className="text-[#263F63] font-black">/</span>
            <span className="text-[#A9BAD4] lowercase">{pageTitle.toLowerCase()}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Date Badge, Notification Bell & User Profile Menu */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Current Date Badge */}
        <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#112541] border border-[#263F63] text-[#A9BAD4] text-xs font-mono shadow-sm">
          <CalendarIcon className="w-4 h-4 text-[#75A7FF]" />
          <span className="text-slate-200">{formattedDate}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-[#112541] hover:bg-[#1B365B] border border-[#263F63] text-[#A9BAD4] hover:text-[#F8FAFC] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 shadow-sm"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 text-[#75A7FF]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#3B82F6] ring-2 ring-[#112541]" />
            )}
          </button>

          {showNotifications && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 mt-3 w-80 rounded-xl bg-[#112541] border border-[#263F63] shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-4 pb-2.5 border-b border-[#263F63] flex items-center justify-between">
                <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#75A7FF]" /> Notifications
                </span>
                {unreadCount > 0 ? (
                  <span className="text-[10px] font-semibold text-[#75A7FF] px-2 py-0.5 rounded-full bg-[#162D4D] border border-[#263F63]">
                    {unreadCount} Unread
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    Up to date
                  </span>
                )}
              </div>

              <div className="divide-y divide-[#263F63]/50 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-2">
                    <Inbox className="w-5 h-5 text-[#7890B2]" />
                    <p className="text-xs text-[#7890B2]">No notifications at this time</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-3 hover:bg-[#1B365B] transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-slate-200 font-medium leading-snug">
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#3B82F6] flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#7890B2] font-mono mt-1 block">
                        {notif.time}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 px-4 border-t border-[#263F63] flex items-center justify-between text-[11px] text-[#A9BAD4]">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" /> All caught up
                </span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-[#75A7FF] hover:underline cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Menu */}
        <UserProfileMenu />
      </div>
    </header>
  );
};
