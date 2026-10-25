import { ImageResponse } from 'next/og';

/*
 * The preview card shown when a Halo link is shared (WhatsApp, Telegram, X,
 * Facebook, LinkedIn). Next.js serves it at /opengraph-image and adds the
 * og:image and twitter:image tags for every page that has no image of its own.
 */

export const alt = 'Halo: book studios, gear and film crews in your city';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Same geometry as the header logo (components/ui/Logo.js)
const APERTURE =
  'M33.2 11.14L24.04 27M34.28 27L15.96 27M21.08 35.86L11.92 20M6.8 28.86L15.96 13M5.72 13L24.04 13M18.92 4.14L28.08 20';

const INK = '#16181d';
const GOLD = '#c98a1b';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: `radial-gradient(circle at 85% 20%, #3a2a10 0%, ${INK} 55%)`,
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <svg width="132" height="132" viewBox="0 0 40 40" fill="none">
            <path d={APERTURE} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="20" r="17.4" stroke={GOLD} strokeWidth="3" />
          </svg>
          <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: '0.14em' }}>HALO</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 52, fontWeight: 600, lineHeight: 1.2, maxWidth: 920 }}>
          Studios, gear and film crews in your city.
        </div>
        <div style={{ marginTop: 24, fontSize: 34, color: GOLD }}>Book the space. Make the work.</div>
      </div>
    ),
    { ...size }
  );
}
