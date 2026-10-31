import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';

interface ConfigStatusBannerProps {
  message: string | null;
}

export const ConfigStatusBanner: React.FC<ConfigStatusBannerProps> = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!message) return null;

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <aside
      aria-label="Configuration notice"
      className="w-full max-w-[1040px] mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 transition-all duration-200 shadow-lg shadow-black/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm">Supabase Credentials Needed</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Setup Pending
              </span>
            </div>
            <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs flex items-center gap-1 text-amber-300 hover:text-white px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 transition-colors flex-shrink-0 cursor-pointer"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              Hide Guide <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Setup Guide <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-amber-500/20 text-xs space-y-3">
          <p className="text-amber-100 font-medium">To activate live Google OAuth & Email sign-in:</p>
          <ol className="list-decimal list-inside space-y-2 text-amber-200/90 ml-1">
            <li>
              Open your{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="underline text-amber-300 hover:text-white inline-flex items-center gap-0.5"
              >
                Supabase Dashboard <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and navigate to <strong>Project Settings &gt; API</strong>.
            </li>
            <li>
              Copy the <strong>Project URL</strong> and <strong>anon (public) Key</strong>.
            </li>
            <li>
              Paste them into your project's <code className="px-1 py-0.5 rounded bg-black/40 text-amber-300">.env</code> file:
            </li>
          </ol>

          <div className="bg-[#081426] p-3 rounded-lg border border-amber-500/30 text-slate-300 font-mono text-[11px] space-y-1 relative group">
            <div className="flex justify-between items-center text-slate-400 pb-1 border-b border-slate-700/50">
              <span>.env</span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key',
                    'env'
                  )
                }
                className="hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'env' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy snippet
                  </>
                )}
              </button>
            </div>
            <div>VITE_SUPABASE_URL=https://your-project-id.supabase.co</div>
            <div>VITE_SUPABASE_ANON_KEY=your-supabase-anon-key</div>
          </div>

          <div className="pt-1 text-[11px] text-amber-300/80">
            <strong>For Google OAuth:</strong> In Supabase, go to <em>Authentication &gt; Providers &gt; Google</em>, enable it, and add your Google Cloud OAuth Client ID & Client Secret with redirect URI set to your Supabase callback URL.
          </div>
        </div>
      )}
    </aside>
  );
};
