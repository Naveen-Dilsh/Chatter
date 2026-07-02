'use client';

import { useId } from 'react';

// Cute robot mascot with a glossy, 3D-looking finish — pure SVG (gradients,
// highlights, soft shadow) + SMIL animation. No libraries, easy to maintain.
// Floats gently, blinks, and has a pulsing antenna light.

export function RobotAvatar({
  size = 40,
  float = true,
  className = '',
}: {
  size?: number;
  float?: boolean;
  className?: string;
}) {
  const raw = useId();
  const uid = raw.replace(/:/g, ''); // ':' breaks url(#id) refs in some browsers

  const id = (name: string) => `${uid}-${name}`;

  return (
    <span
      className={`inline-flex ${float ? 'animate-kapuru-float' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none">
        <defs>
          {/* head volume: light top → shaded bottom (emerald so it reads on white) */}
          <linearGradient id={id('head')} x1="24" y1="10" x2="24" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6ee7b7" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
          {/* top-left sheen */}
          <radialGradient id={id('sheen')} cx="0.32" cy="0.26" r="0.7">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* glossy dark visor */}
          <linearGradient id={id('visor')} x1="14" y1="15" x2="34" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0b6b4f" />
            <stop offset="1" stopColor="#022c22" />
          </linearGradient>
          {/* metallic antenna + ears */}
          <linearGradient id={id('metal')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#6ee7b7" />
          </linearGradient>
          {/* glowing eyes */}
          <radialGradient id={id('eye')} cx="0.5" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#ecfeff" />
            <stop offset="1" stopColor="#34d399" />
          </radialGradient>
          {/* soft drop shadow to lift the robot off the background */}
          <filter id={id('shadow')} x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.9" floodColor="#022c22" floodOpacity="0.35" />
          </filter>
        </defs>

        <g filter={`url(#${id('shadow')})`}>
          {/* antenna */}
          <line x1="24" y1="11" x2="24" y2="6" stroke={`url(#${id('metal')})`} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="24" cy="5" r="2.3" fill="#fde68a">
            <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="r" values="2.3;2.7;2.3" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="23.3" cy="4.4" r="0.7" fill="#fffbeb" opacity="0.9" />

          {/* ears */}
          <rect x="6.5" y="20" width="3.6" height="8" rx="1.8" fill={`url(#${id('metal')})`} />
          <rect x="37.9" y="20" width="3.6" height="8" rx="1.8" fill={`url(#${id('metal')})`} />

          {/* head */}
          <rect x="10" y="11" width="28" height="26" rx="9" fill={`url(#${id('head')})`} stroke="#047857" strokeWidth="0.6" />
          {/* head sheen */}
          <rect x="10" y="11" width="28" height="26" rx="9" fill={`url(#${id('sheen')})`} />

          {/* visor */}
          <rect x="13.5" y="15.5" width="21" height="14.5" rx="7" fill={`url(#${id('visor')})`} />
          {/* glass reflection */}
          <path d="M16 17 q6 -1.5 12 0.5 -3 2.5 -9 2 z" fill="#ffffff" opacity="0.12" />

          {/* eyes (blink) */}
          <g fill={`url(#${id('eye')})`}>
            <ellipse cx="20" cy="22.6" rx="2.4" ry="2.8">
              <animate attributeName="ry" values="2.8;2.8;2.8;0.3;2.8" keyTimes="0;0.85;0.9;0.93;1" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="28" cy="22.6" rx="2.4" ry="2.8">
              <animate attributeName="ry" values="2.8;2.8;2.8;0.3;2.8" keyTimes="0;0.85;0.9;0.93;1" dur="4s" repeatCount="indefinite" />
            </ellipse>
          </g>
          {/* eye sparkle */}
          <circle cx="19.2" cy="21.7" r="0.6" fill="#ffffff" />
          <circle cx="27.2" cy="21.7" r="0.6" fill="#ffffff" />

          {/* smile */}
          <path d="M21 26.6 q3 2.4 6 0" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none" />

          {/* cheeks */}
          <circle cx="15.6" cy="27.6" r="1.5" fill="#fca5a5" opacity="0.85" />
          <circle cx="32.4" cy="27.6" r="1.5" fill="#fca5a5" opacity="0.85" />
        </g>
      </svg>
    </span>
  );
}
