import React from 'react';

export const WorkspaceGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full max-w-[340px] aspect-[16/10] relative flex items-center justify-center select-none ${className}`}>
      {/* Soft atmospheric ambient glow */}
      <div className="absolute inset-0 bg-[#2563EB]/10 rounded-full blur-2xl pointer-events-none" />

      <svg
        className="w-full h-full relative z-10"
        viewBox="0 0 340 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="orbitGrad" x1="0" y1="0" x2="340" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#75A7FF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="tileGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10223D" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Coordinate Grid Texture */}
        <g opacity="0.15">
          <path
            d="M40 30H300M40 70H300M40 110H300M40 150H300M40 190H300"
            stroke="#75A7FF"
            strokeDasharray="2 4"
            strokeWidth="0.75"
          />
          <path
            d="M70 10V200M120 10V200M170 10V200M220 10V200M270 10V200"
            stroke="#75A7FF"
            strokeDasharray="2 4"
            strokeWidth="0.75"
          />
        </g>

        {/* Concentric Orbital Nodes */}
        <ellipse cx="170" cy="105" rx="135" ry="62" stroke="url(#orbitGrad)" strokeWidth="1.25" />
        <ellipse
          cx="170"
          cy="105"
          rx="95"
          ry="42"
          stroke="#2563EB"
          strokeDasharray="4 6"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
        <ellipse cx="170" cy="105" rx="55" ry="24" stroke="#75A7FF" strokeOpacity="0.4" strokeWidth="1" />

        {/* Central Isometric Task Module */}
        <g transform="translate(110, 68)">
          <polygon
            points="60,10 105,32 60,54 15,32"
            fill="url(#tileGlow)"
            stroke="#2563EB"
            strokeWidth="1.2"
          />
          <polygon
            points="15,32 60,54 60,68 15,46"
            fill="#081426"
            opacity="0.85"
            stroke="#2563EB"
            strokeWidth="0.8"
          />
          <polygon
            points="105,32 60,54 60,68 105,46"
            fill="#10223D"
            opacity="0.85"
            stroke="#2563EB"
            strokeWidth="0.8"
          />
          <circle cx="60" cy="32" r="3.5" fill="#75A7FF" />
          <line x1="45" y1="25" x2="75" y2="39" stroke="#75A7FF" strokeWidth="1" opacity="0.7" />
        </g>

        {/* Satellite Isometric Node Left */}
        <g transform="translate(50, 88)">
          <polygon
            points="35,6 62,20 35,34 8,20"
            fill="#10223D"
            stroke="#2563EB"
            strokeOpacity="0.6"
            strokeWidth="1"
          />
          <circle cx="35" cy="20" r="2" fill="#2563EB" />
        </g>

        {/* Satellite Isometric Node Right */}
        <g transform="translate(210, 50)">
          <polygon
            points="35,6 62,20 35,34 8,20"
            fill="#10223D"
            stroke="#75A7FF"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
          <circle cx="35" cy="20" r="2" fill="#75A7FF" />
        </g>

        {/* Data Coordinate Markers & Badges */}
        <circle cx="280" cy="132" r="3" fill="#2563EB" className="animate-pulse" />
        <circle cx="60" cy="80" r="2.5" fill="#75A7FF" />
        <text
          x="35"
          y="24"
          fill="#A9BAD4"
          fontFamily="'Inter', monospace"
          fontSize="8"
          letterSpacing="1"
          opacity="0.8"
        >
          INDEX :: 0x4F9B
        </text>
        <text
          x="235"
          y="196"
          fill="#A9BAD4"
          fontFamily="'Inter', monospace"
          fontSize="8"
          letterSpacing="1"
          opacity="0.8"
        >
          SYNC :: ENCRYPTED
        </text>
      </svg>
    </div>
  );
};
