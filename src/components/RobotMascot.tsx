'use client';

import { useId } from 'react';

// Full-body animated robot character "Kapruu" — pure SVG, no libraries.
// Floats, blinks, pulses its chest light, and waves its right arm hello.

export function RobotMascot({ size = 140, className = '' }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${uid}-${n}`;

  return (
    <span
      className={`inline-flex animate-kapuru-float ${className}`}
      style={{ width: size, height: (size * 86) / 72 }}
      aria-hidden
    >
      <svg viewBox="0 0 72 86" width="100%" height="100%" fill="none">
        <defs>
          <linearGradient id={id('body')} x1="36" y1="12" x2="36" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6ee7b7" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
          <linearGradient id={id('visor')} x1="23" y1="20" x2="49" y2="37" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0b6b4f" />
            <stop offset="1" stopColor="#022c22" />
          </linearGradient>
          <radialGradient id={id('sheen')} cx="0.34" cy="0.26" r="0.7">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('eye')} cx="0.5" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#ecfeff" />
            <stop offset="1" stopColor="#34d399" />
          </radialGradient>
          <filter id={id('shadow')} x="-30%" y="-20%" width="160%" height="150%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#022c22" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* ground shadow */}
        <ellipse cx="36" cy="82" rx="17" ry="2.6" fill="#022c22" opacity="0.12" />

        <g filter={`url(#${id('shadow')})`} stroke="#047857" strokeWidth="0.7">
          {/* legs / feet */}
          <rect x="27" y="70" width="8" height="7" rx="3" fill="#047857" />
          <rect x="37" y="70" width="8" height="7" rx="3" fill="#047857" />

          {/* left arm (resting) */}
          <rect x="13" y="50" width="6.5" height="16" rx="3.25" fill="#047857" />
          <circle cx="16.2" cy="67" r="3.4" fill="#10b981" />

          {/* body */}
          <rect x="21" y="47" width="30" height="24" rx="9" fill={`url(#${id('body')})`} />
          <rect x="21" y="47" width="30" height="24" rx="9" fill={`url(#${id('sheen')})`} stroke="none" />
          {/* chest light */}
          <circle cx="36" cy="59" r="3.1" fill="#fde68a" stroke="none">
            <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite" />
          </circle>

          {/* neck */}
          <rect x="32" y="42" width="8" height="6" rx="2" fill="#047857" />

          {/* head */}
          <rect x="18" y="13" width="36" height="31" rx="12" fill={`url(#${id('body')})`} />
          <rect x="18" y="13" width="36" height="31" rx="12" fill={`url(#${id('sheen')})`} stroke="none" />

          {/* antenna */}
          <line x1="36" y1="13" x2="36" y2="7" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
          <circle cx="36" cy="6" r="2.8" fill="#fde68a" stroke="none">
            <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="r" values="2.8;3.3;2.8" dur="1.6s" repeatCount="indefinite" />
          </circle>

          {/* visor */}
          <rect x="23" y="19.5" width="26" height="17.5" rx="8" fill={`url(#${id('visor')})`} stroke="none" />
          <path d="M27 22 q8 -1.6 15 0.6 -4 3 -11 2.4 z" fill="#ffffff" opacity="0.12" stroke="none" />

          {/* eyes (blink) */}
          <g fill={`url(#${id('eye')})`} stroke="none">
            <ellipse cx="30" cy="28.5" rx="3" ry="3.5">
              <animate attributeName="ry" values="3.5;3.5;3.5;0.4;3.5" keyTimes="0;0.85;0.9;0.93;1" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="42" cy="28.5" rx="3" ry="3.5">
              <animate attributeName="ry" values="3.5;3.5;3.5;0.4;3.5" keyTimes="0;0.85;0.9;0.93;1" dur="4s" repeatCount="indefinite" />
            </ellipse>
          </g>
          <circle cx="28.9" cy="27.3" r="0.8" fill="#ffffff" stroke="none" />
          <circle cx="40.9" cy="27.3" r="0.8" fill="#ffffff" stroke="none" />

          {/* smile + cheeks */}
          <path d="M32 33 q4 3 8 0" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <circle cx="26.5" cy="33.5" r="1.8" fill="#fca5a5" opacity="0.85" stroke="none" />
          <circle cx="45.5" cy="33.5" r="1.8" fill="#fca5a5" opacity="0.85" stroke="none" />

          {/* right arm — WAVING */}
          <g style={{ transformOrigin: '52px 50px' }}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-12 52 50; 18 52 50; -12 52 50"
              keyTimes="0;0.5;1"
              dur="1.3s"
              repeatCount="indefinite"
            />
            <rect x="50" y="38" width="6.5" height="15" rx="3.25" fill="#047857" />
            <circle cx="53.2" cy="38" r="3.6" fill="#10b981" />
          </g>
        </g>
      </svg>
    </span>
  );
}
