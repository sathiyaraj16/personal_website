import React from 'react';
import { Quote, Sparkles } from 'lucide-react';

interface MotivationPair {
  line1: string;
  line2: string;
}

const motivationPairs: MotivationPair[] = [
  {
    line1: 'Focus on what moves the needle forward today.',
    line2: 'Consistent micro-actions compound into extraordinary results.',
  },
  {
    line1: 'Clarity precedes high performance.',
    line2: 'Eliminate distractions and execute your top priority with conviction.',
  },
  {
    line1: 'Deep work creates lasting leverage.',
    line2: 'Protect your focus time and let momentum carry your progress.',
  },
  {
    line1: 'Excellence is not an accident but a daily practice.',
    line2: 'Master the fundamentals today and let quality speak for itself.',
  },
  {
    line1: 'One meaningful objective achieved changes everything.',
    line2: 'Begin with intentionality and see each commitment through.',
  },
  {
    line1: 'Simplicity is the prerequisite for velocity.',
    line2: 'Streamline your workflows and keep your attention centered.',
  },
  {
    line1: 'Discipline bridges intention and reality.',
    line2: 'Show up with purpose and build momentum one task at a time.',
  },
];

export const MotivationCard: React.FC = () => {
  // Deterministic daily message selection based on current date
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const currentQuote = motivationPairs[dayOfYear % motivationPairs.length];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#112541] border border-[#263F63] p-6 shadow-lg shadow-black/20 transition-all hover:border-[#75A7FF]/40 flex flex-col justify-between h-full">
      {/* Subtle atmospheric blue backlight */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 w-44 h-44 rounded-full bg-[#3B82F6]/15 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] flex-shrink-0 shadow-sm mt-0.5">
          <Quote className="w-5 h-5" />
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#75A7FF] font-bold">
              Daily Focus
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#75A7FF]" />
            <span className="text-[11px] text-[#A9BAD4] font-mono">Today's Axiom</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-[#F8FAFC] tracking-tight leading-snug">
            {currentQuote.line1}
          </p>
          <p className="text-xs sm:text-sm text-[#A9BAD4] font-medium leading-relaxed">
            {currentQuote.line2}
          </p>
        </div>
      </div>

      <div className="relative z-10 pt-3 mt-3 border-t border-[#263F63]/80 flex items-center justify-between text-[11px] text-[#A9BAD4]">
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#75A7FF]" /> Curated daily mindset
        </span>
        <span className="font-mono text-[#7890B2]">Day {dayOfYear}</span>
      </div>
    </div>
  );
};
