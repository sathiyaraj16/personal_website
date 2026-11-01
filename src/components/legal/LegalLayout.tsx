import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NexaLogo } from '../NexaLogo';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Lock,
  ChevronRight,
  Printer,
  Sparkles,
} from 'lucide-react';

export interface TocItem {
  id: string;
  title: string;
  badge?: string;
}

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  documentType: 'privacy' | 'terms';
  lastUpdated: string;
  effectiveDomain: string;
  tocItems: TocItem[];
  children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  subtitle,
  documentType,
  lastUpdated,
  effectiveDomain,
  tocItems,
  children,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string>(tocItems[0]?.id || '');

  // Scroll to hash if present or scroll to top on page load
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(location.hash.slice(1));
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.hash]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      for (let i = tocItems.length - 1; i >= 0; i--) {
        const item = tocItems[i];
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const backUrl = user ? '/dashboard' : '/login';
  const backLabel = user ? 'Back to Dashboard' : 'Back to Sign In';

  return (
    <div className="min-h-screen bg-[#081426] text-[#F8FAFC] flex flex-col font-['Inter',sans-serif] selection:bg-[#3B82F6] selection:text-white">
      {/* Background Atmospheric Radial Gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(37,99,235,0.14),rgba(8,20,38,0))]"
        aria-hidden="true"
      />

      {/* Persistent Legal Topbar */}
      <header className="sticky top-0 z-40 w-full bg-[#10223D]/90 backdrop-blur-md border-b border-[#263F63] px-4 sm:px-6 lg:px-12 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Back Button */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Link
              to={backUrl}
              className="flex items-center gap-2 text-xs font-semibold text-[#A9BAD4] hover:text-white transition-colors group px-2.5 py-1.5 rounded-lg hover:bg-[#162D4D] border border-transparent hover:border-[#263F63]"
              title={backLabel}
            >
              <ArrowLeft className="w-4 h-4 text-[#75A7FF] group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Link>

            <div className="h-5 w-px bg-[#263F63] hidden sm:block" />

            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <NexaLogo size="sm" showTag={true} />
            </Link>
          </div>

          {/* Navigation Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#081426] rounded-xl border border-[#263F63] text-xs font-medium">
            <Link
              to="/privacy"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                documentType === 'privacy'
                  ? 'bg-[#3B82F6] text-white shadow-sm font-semibold'
                  : 'text-[#A9BAD4] hover:text-white hover:bg-[#162D4D]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Privacy</span>
              <span className="xs:hidden">Privacy</span>
            </Link>

            <Link
              to="/terms"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                documentType === 'terms'
                  ? 'bg-[#3B82F6] text-white shadow-sm font-semibold'
                  : 'text-[#A9BAD4] hover:text-white hover:bg-[#162D4D]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Terms</span>
              <span className="xs:hidden">Terms</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Document Hero Header */}
      <section className="relative z-10 w-full border-b border-[#263F63] bg-[#0d1c33]/70 px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#162D4D] border border-[#75A7FF]/30 text-[#75A7FF] font-semibold">
              <Sparkles className="w-3 h-3 text-[#75A7FF]" />
              Official Legal Documentation
            </span>
            <span className="text-[#7890B2]">•</span>
            <span className="text-[#A9BAD4]">Deployment: {effectiveDomain}</span>
            <span className="text-[#7890B2]">•</span>
            <span className="text-[#75A7FF] font-semibold">Last Updated: {lastUpdated}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-1">
            <div className="space-y-2 max-w-3xl">
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                {title}
              </h1>
              <p className="text-sm sm:text-base text-[#A9BAD4] leading-relaxed">
                {subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-[#112541] hover:bg-[#162D4D] border border-[#263F63] text-xs font-semibold text-[#A9BAD4] hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Print or save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-[#75A7FF]" />
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Placeholder Transparency Alert Box */}
          <div className="p-4 rounded-xl bg-[#112541]/90 border border-blue-500/30 flex items-start gap-3 text-xs text-[#A9BAD4] shadow-md mt-4">
            <Lock className="w-4 h-4 text-[#75A7FF] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[#F8FAFC] font-semibold">
                Transparent Legal & Cryptographic Disclosures
              </p>
              <p className="leading-relaxed">
                This document reflects the verified architectural capabilities of the NEXA Workspace application.
                Specific organizational identifiers are designated with clear brackets (e.g., <code className="text-[#75A7FF] bg-[#081426] px-1.5 py-0.5 rounded font-mono">[Insert Legal Entity]</code>) for customized corporate deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Document Body */}
      <main className="relative z-10 w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Sticky Table of Contents (Desktop) */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 space-y-5">
              <div className="p-5 rounded-2xl bg-[#10223D] border border-[#263F63] shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#263F63]">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#75A7FF] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Table of Contents
                  </span>
                  <span className="text-[11px] font-mono text-[#7890B2]">
                    {tocItems.length} Sections
                  </span>
                </div>

                <nav className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {tocItems.map((item, index) => {
                    const isActive = activeSection === item.id;
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(item.id);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                            setActiveSection(item.id);
                            window.history.pushState(null, '', `#${item.id}`);
                          }
                        }}
                        className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                          isActive
                            ? 'bg-[#3B82F6] text-white font-semibold shadow-md'
                            : 'text-[#A9BAD4] hover:text-white hover:bg-[#162D4D]'
                        }`}
                      >
                        <span className={`font-mono text-[11px] mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#7890B2]'}`}>
                          {String(index + 1).padStart(2, '0')}.
                        </span>
                        <span className="leading-snug line-clamp-2">
                          {item.title}
                        </span>
                      </a>
                    );
                  })}
                </nav>
              </div>

              {/* Related Document Quick Link Card */}
              <div className="p-4 rounded-xl bg-[#112541] border border-[#263F63] flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#7890B2]">Also review:</span>
                  <p className="font-semibold text-white">
                    {documentType === 'privacy' ? 'Terms of Service' : 'Privacy Policy'}
                  </p>
                </div>
                <Link
                  to={documentType === 'privacy' ? '/terms' : '/privacy'}
                  className="px-3 py-1.5 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] border border-[#263F63] text-xs font-semibold text-[#75A7FF] hover:text-white flex items-center gap-1 transition-all"
                >
                  View <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Right Column: Legal Document Content */}
          <article className="lg:col-span-8 xl:col-span-9 space-y-12 min-w-0">
            {children}

            {/* Back to Top / Home Footer Actions */}
            <div className="pt-8 border-t border-[#263F63] flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                to={backUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10223D] hover:bg-[#162D4D] border border-[#263F63] text-xs font-semibold text-[#F8FAFC] transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-[#75A7FF]" />
                {backLabel}
              </Link>

              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xs font-semibold text-[#75A7FF] hover:text-white transition-colors"
              >
                ↑ Back to Top
              </button>
            </div>
          </article>
        </div>
      </main>

      {/* Global Legal Footer */}
      <footer className="relative z-10 w-full border-t border-[#263F63] bg-[#081426] px-4 sm:px-6 lg:px-12 py-8 mt-12 text-xs text-[#A9BAD4]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <NexaLogo size="sm" showTag={false} />
            <span>© 2026 NEXA Workspace. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px]">
            <Link to="/privacy" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            <span className="text-[#263F63]">•</span>
            <Link to="/terms" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              Terms of Service
            </Link>
            <span className="text-[#263F63]">•</span>
            <Link to={backUrl} className="hover:text-white transition-colors">
              {user ? 'Dashboard' : 'Sign In'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
