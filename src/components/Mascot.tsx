'use client';

// Playful gradient mascot for Kapruu — a bouncy squircle with an emoji face
// and optional twinkling sparkles. Pure CSS, no libraries.

export function Mascot({
  size = 44,
  emoji = '🌴',
  bounce = true,
  sparkles = false,
  className = '',
}: {
  size?: number;
  emoji?: string;
  bounce?: boolean;
  sparkles?: boolean;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      {sparkles && (
        <>
          <Sparkle className="-left-2 -top-1 animate-kapuru-twinkle" style={{ animationDelay: '0s' }} />
          <Sparkle className="-right-2 top-1 animate-kapuru-twinkle" style={{ animationDelay: '0.6s' }} />
          <Sparkle className="-bottom-1 left-2 animate-kapuru-twinkle" style={{ animationDelay: '1.1s' }} />
        </>
      )}
      <span
        className={`sticker flex h-full w-full items-center justify-center rounded-[34%] bg-gradient-to-br from-green to-[#3ecf8e] ${
          bounce ? 'animate-kapuru-bounce' : ''
        }`}
        style={{ fontSize: size * 0.5, lineHeight: 1 }}
      >
        <span className="drop-shadow-sm">{emoji}</span>
      </span>
    </span>
  );
}

function Sparkle({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`absolute z-10 text-amber-300 ${className}`} style={{ fontSize: 11, ...style }}>
      ✦
    </span>
  );
}
