import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield, ChevronDown, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserProfileMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Workspace User';

  const email = user?.email || 'user@nexa.workspace';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const provider = user?.app_metadata?.provider || 'email';

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#112541] hover:bg-[#1B365B] border border-[#263F63] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50 shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
      >
        <div className="w-9 h-9 rounded-full bg-[#3B82F6] text-white flex items-center justify-center overflow-hidden font-bold text-sm border-2 border-[#75A7FF]/40 shadow-sm flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span>{displayName.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <div className="hidden md:flex flex-col text-left">
          <span className="text-sm font-semibold text-[#F8FAFC] tracking-tight leading-tight line-clamp-1">
            {displayName}
          </span>
          <span className="text-xs text-[#A9BAD4] leading-tight line-clamp-1 font-mono">
            {email}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#A9BAD4] transition-transform duration-200 hidden sm:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl bg-[#112541] border border-[#263F63] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Summary */}
          <div className="px-4 py-3.5 border-b border-[#263F63]">
            <p className="text-sm font-bold text-[#F8FAFC] truncate">{displayName}</p>
            <p className="text-xs text-[#A9BAD4] truncate font-mono mt-0.5">{email}</p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[#162D4D] text-[#75A7FF] border border-[#263F63] flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                {provider} authorized
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/profile');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#1B365B] rounded-lg transition-colors cursor-pointer text-left"
            >
              <UserIcon className="w-4 h-4 text-[#75A7FF]" />
              Profile & Account
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/locker');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#1B365B] rounded-lg transition-colors cursor-pointer text-left"
            >
              <Shield className="w-4 h-4 text-[#75A7FF]" />
              Security Settings & Locker
            </button>
          </div>

          {/* Sign Out Button */}
          <div className="p-1.5 border-t border-[#263F63] mt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              Sign Out of NEXA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
