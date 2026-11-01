import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { lockerService } from '../services/lockerService';

const routeTitleMap: Record<string, { title: string; breadcrumb: string }> = {
  '/dashboard': { title: 'Dashboard', breadcrumb: 'Workspace' },
  '/todos': { title: 'To-Do List', breadcrumb: 'Workspace' },
  '/photos': { title: 'Google Photos', breadcrumb: 'Media' },
  '/drive': { title: 'Google Drive', breadcrumb: 'Storage' },
  '/profile': { title: 'Profile & Account', breadcrumb: 'Settings' },
  '/locker': { title: 'Secure Locker', breadcrumb: 'Security' },
};

export const DashboardLayout: React.FC = () => {
  // Default to collapsed on tablet screens (768px - 1023px)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Core Zero-Trust Auto-Lock:
  // Whenever user navigates away from '/locker' to ANY other section,
  // immediately lock the Secure Locker and purge in-memory keys.
  useEffect(() => {
    if (location.pathname !== '/locker' && lockerService.isVaultUnlocked()) {
      lockerService.lockVault(user?.id || '');
    }
  }, [location.pathname, user?.id]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle tablet responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentRouteMeta = routeTitleMap[location.pathname] || {
    title: 'Workspace',
    breadcrumb: 'NEXA',
  };

  return (
    <div className="min-h-screen bg-[#081426] text-[#F8FAFC] flex font-['Inter',sans-serif] selection:bg-[#3B82F6] selection:text-white">
      {/* Persistent Left Sidebar (240px expanded, 72px collapsed) */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Body Area: Expands across the available desktop viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Topbar: 80px height for refined alignment */}
        <Topbar
          onOpenMobileSidebar={() => setMobileOpen(true)}
          pageTitle={currentRouteMeta.title}
          breadcrumb={currentRouteMeta.breadcrumb}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 w-full px-4 sm:px-6 md:px-8 xl:px-10 py-6 sm:py-8">
          <Outlet />
        </main>

        {/* Workspace Footer */}
        <footer className="border-t border-[#263F63] px-4 sm:px-6 md:px-8 xl:px-10 py-4 text-xs text-[#A9BAD4] font-mono flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#081426]/90">
          <div className="flex flex-wrap items-center gap-2">
            <span>© 2026 NEXA Workspace</span>
            <span className="text-slate-600">•</span>
            <Link to="/privacy" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            <span className="text-slate-600">•</span>
            <Link to="/terms" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              Terms of Service
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-[#7890B2]">256-bit AES Active</span>
            <span className="text-[#75A7FF]">v4.12-sec</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
