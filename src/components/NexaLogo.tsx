import React from 'react';

interface NexaLogoProps {
  showTag?: boolean;
  showText?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NexaLogo: React.FC<NexaLogoProps> = ({
  showTag = true,
  showText = true,
  className = '',
  size = 'md',
}) => {
  const iconDimensions = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textClass = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-[17px]';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Precision Geometric Hexagonal Nexa Shield */}
      <div
        className={`${iconDimensions} rounded-lg bg-[#142032] border border-[#2563EB]/40 flex items-center justify-center shadow-lg shadow-blue-900/30 transition-transform duration-200 hover:scale-105 flex-shrink-0`}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2Z"
            fill="#10223D"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 6L7 9V15L12 18L17 15V9L12 6Z"
            fill="#2563EB"
            fillOpacity="0.35"
            stroke="#75A7FF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.5" fill="#75A7FF" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-shrink-0">
          <span className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-tight text-white whitespace-nowrap flex-shrink-0 ${textClass}`}>
            NEXA
          </span>
          {showTag && (
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#75A7FF] px-1.5 py-0.5 rounded bg-[#162D4D] border border-[#75A7FF]/30 whitespace-nowrap flex-shrink-0">
              Workspace
            </span>
          )}
        </div>
      )}
    </div>
  );
};
