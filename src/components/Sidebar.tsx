import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Image as ImageIcon,
  HardDrive,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { NexaLogo } from './NexaLogo';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'To-Do List', path: '/todos', icon: CheckSquare },
  { name: 'Google Photos', path: '/photos', icon: ImageIcon },
  { name: 'Google Drive', path: '/drive', icon: HardDrive },
  { name: 'Profile & Account', path: '/profile', icon: User },
  { name: 'Secure Locker', path: '/locker', icon: ShieldCheck },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  // Force expanded presentation inside mobile drawer for clarity
  const isEffectiveCollapsed = collapsed && !mobileOpen;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Persistent Sticky Sidebar (240px expanded, 72px collapsed) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-[#10223D] border-r border-[#263F63] flex flex-col justify-between transition-[width,transform] duration-200 ease-in-out flex-shrink-0 ${
          isEffectiveCollapsed ? 'w-[72px]' : 'w-[240px]'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding Section */}
        <div className="flex flex-col">
          <div className="h-20 flex items-center justify-between px-3 border-b border-[#263F63] relative">
            {/* Logo Section: Takes available space and prevents overflow */}
            <div
              className={`flex items-center min-w-0 transition-all duration-200 ${
                isEffectiveCollapsed
                  ? 'justify-center w-full'
                  : 'flex-1 gap-2 overflow-hidden'
              }`}
            >
              <NexaLogo
                showText={!isEffectiveCollapsed}
                showTag={!isEffectiveCollapsed}
                size="md"
              />
            </div>

            {/* Collapse / Expand Toggle Button (Desktop Only) */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`hidden lg:flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isEffectiveCollapsed
                  ? 'absolute -right-3.5 top-6.5 w-7 h-7 rounded-full bg-[#10223D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] shadow-lg shadow-black/40 z-50 hover:scale-105'
                  : 'relative flex-shrink-0 w-7 h-7 rounded-lg bg-[#081426] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] ml-2'
              }`}
              aria-label={isEffectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isEffectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isEffectiveCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items with 48px Height & Increased Spacing */}
          <nav
            className={`space-y-2 transition-all duration-200 ${
              isEffectiveCollapsed ? 'p-2' : 'p-3.5'
            }`}
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl text-[15px] font-semibold transition-all duration-200 group cursor-pointer relative ${
                      isActive
                        ? 'bg-[#3B82F6] text-[#F8FAFC] shadow-lg shadow-blue-500/25 border border-blue-400/40'
                        : 'text-[#A9BAD4] hover:text-[#F8FAFC] hover:bg-[#1B365B]'
                    } ${
                      isEffectiveCollapsed
                        ? 'justify-center w-full h-[48px] px-0'
                        : 'gap-3.5 px-4 h-[48px]'
                    }`
                  }
                  title={isEffectiveCollapsed ? item.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-[#75A7FF] group-hover:text-white'
                        }`}
                      />

                      {!isEffectiveCollapsed && (
                        <div className="flex items-center justify-between flex-1 truncate animate-in fade-in duration-200">
                          <span className="truncate tracking-tight font-medium">
                            {item.name}
                          </span>
                          {item.badge && !isActive && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#162D4D] text-[#75A7FF] border border-[#263F63]">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Active indicator bar when collapsed */}
                      {isActive && isEffectiveCollapsed && (
                        <span className="absolute left-1 top-2.5 bottom-2.5 w-1 bg-white rounded-r-full" />
                      )}

                      {/* Floating tooltip on hover when collapsed */}
                      {isEffectiveCollapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#162D4D] text-[#F8FAFC] text-xs font-semibold whitespace-nowrap border border-[#263F63] shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 hidden lg:block">
                          {item.name}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Cloud Status Container */}
        <div
          className={`border-t border-[#263F63] transition-all duration-200 ${
            isEffectiveCollapsed ? 'p-2' : 'p-3.5'
          }`}
        >
          {!isEffectiveCollapsed ? (
            <div className="p-3.5 rounded-xl bg-[#112541] border border-[#263F63] flex flex-col gap-2 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#75A7FF] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#75A7FF]" /> NEXA Cloud
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Synced
                </span>
              </div>
              <p className="text-[11px] text-[#A9BAD4] leading-relaxed">
                Supabase OAuth session active. AES-256 vault protected.
              </p>
            </div>
          ) : (
            <div
              className="flex justify-center py-2 relative group cursor-default"
              title="NEXA Cloud Active"
            >
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#162D4D] text-emerald-400 text-xs font-semibold whitespace-nowrap border border-[#263F63] shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 hidden lg:block">
                NEXA Cloud Synced
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
