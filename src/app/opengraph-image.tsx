import { ImageResponse } from 'next/og';

// Social/share preview card — generated at request time, no asset needed.
export const alt = 'Kapruu — Your Kapruka Shopping Companion';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          backgroundColor: '#fff7ea',
          backgroundImage:
            'radial-gradient(60% 55% at 10% 10%, rgba(62,207,142,0.25), transparent 60%),' +
            'radial-gradient(60% 55% at 90% 15%, rgba(255,122,89,0.20), transparent 60%),' +
            'radial-gradient(60% 60% at 85% 90%, rgba(98,201,232,0.20), transparent 60%),' +
            'radial-gradient(55% 55% at 15% 90%, rgba(255,206,61,0.22), transparent 60%)',
        }}
      >
        <div style={{ display: 'flex', fontSize: 120 }}>🌴 🎁 🌸</div>
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 800,
            color: '#2c2218',
            letterSpacing: -2,
          }}
        >
          Kapruu
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 34,
            fontWeight: 700,
            color: '#15875a',
          }}
        >
          Your Kapruka shopping companion 🇱🇰
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 26,
            padding: '14px 34px',
            borderRadius: 999,
            border: '4px solid #2c2218',
            boxShadow: '6px 6px 0 0 #2c2218',
            backgroundColor: '#ffce3d',
            fontSize: 28,
            fontWeight: 800,
            color: '#2c2218',
          }}
        >
          flowers · cakes · chocolates · gifts — delivered across Sri Lanka
        </div>
      </div>
    ),
    { ...size, emoji: 'twemoji' },
  );
}
