import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Radio } from 'lucide-react';

export const WelcomeSection: React.FC = () => {
  const { user } = useAuth();

  // Dynamic time-based greeting
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const rawName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Member';

  // Capitalize neatly
  const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif]">
          {greeting}, {formattedName}
        </h2>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#75A7FF] px-3 py-1 rounded-full bg-[#112541] border border-[#263F63] shadow-sm">
            <Radio className="w-3.5 h-3.5 text-[#3B82F6] animate-pulse" />
            NODE 01 ACTIVE
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            E2EE Vault
          </span>
        </div>
      </div>
      <p className="text-base sm:text-lg text-[#A9BAD4] font-normal leading-relaxed">
        Welcome to your personal productivity workspace. All your tasks, files, and notes in unified flow.
      </p>
    </div>
  );
};
