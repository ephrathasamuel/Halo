'use client';

import { useEffect, useId, useRef, useState } from 'react';

/*
 * The aperture: six blade lines, each touching an inner circle (radius 7) so they
 * form a hexagonal opening, running out to the inside edge of the gold ring.
 * Generated from geometry, not drawn by hand, so the six blades are exactly even.
 */
const APERTURE =
  'M33.2 11.14L24.04 27M34.28 27L15.96 27M21.08 35.86L11.92 20M6.8 28.86L15.96 13M5.72 13L24.04 13M18.92 4.14L28.08 20';

/* Cursive "h" revealed when the aperture opens */
const SCRIPT_H =
  'M14 29.2C16.2 22.6 19.6 14.6 20.7 10.2C21.4 6.9 17.9 5.9 17 9C16.2 12.4 16.2 21.2 15.8 29.2C17.2 24.3 19.7 21 22.4 21C24.6 21 25.1 22.9 24.4 25.3C23.8 27.4 24.4 29.6 27.4 28.1';

/* Greetings the wordmark cycles through on hover or touch */
// Each in its own script: English, Amharic, Swahili, Arabic, Hebrew, Russian, French, Spanish
const GREETINGS = ['Hello', 'ሰላም', 'Jambo', 'مرحبا', 'שלום', 'Привет', 'Bonjour', 'Hola'];
const GREETING_MS = 1600;

/**
 * Halo logo: an animated aperture inside a gold ring, plus the HALO wordmark.
 * Hovering (or touching) the logo turns HALO into "Hello" in a few languages.
 * @param {{ className?: string, tone?: 'dark' | 'light', markOnly?: boolean, animated?: boolean }} props
 */
export function Logo({ className = '', tone = 'dark', markOnly = false, animated = true }) {
  const ink = tone === 'light' ? '#ffffff' : 'var(--halo-ink)';
  const [greeting, setGreeting] = useState(-1); // -1 shows HALO
  const timer = useRef(null);

  const startGreeting = () => {
    if (timer.current) return;
    setGreeting(0);
    timer.current = setInterval(() => setGreeting((g) => (g + 1) % GREETINGS.length), GREETING_MS);
  };
  const stopGreeting = () => {
    clearInterval(timer.current);
    timer.current = null;
    setGreeting(-1);
  };

  useEffect(() => () => clearInterval(timer.current), []);

  // Phones have no hover: a touch shows the greetings for a few seconds
  const onTouchStart = () => {
    startGreeting();
    setTimeout(stopGreeting, GREETINGS.length * GREETING_MS);
  };

  const greetingText = greeting >= 0 ? GREETINGS[greeting] : null;

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      onMouseEnter={startGreeting}
      onMouseLeave={stopGreeting}
      onTouchStart={onTouchStart}
    >
      <LogoMark ink={ink} animated={animated} />
      {!markOnly && (
        // Grid stacks both words in one cell, so the width never jumps
        <span className="inline-grid min-w-[4.5em] text-[1.15rem] font-semibold leading-none" style={{ color: ink }}>
          <span
            className={`col-start-1 row-start-1 tracking-[0.14em] pl-[0.02em] transition-opacity duration-200 ${
              greetingText ? 'opacity-0' : 'opacity-100'
            }`}
          >
            HALO
          </span>
          <span
            key={greetingText || 'none'}
            dir="auto"
            aria-hidden="true"
            className={`col-start-1 row-start-1 text-left whitespace-nowrap tracking-[0.02em] text-halo-gold-ink transition-opacity duration-200 ${
              greetingText ? 'opacity-100 animate-[halo-greet_0.35s_ease-out]' : 'opacity-0'
            }`}
          >
            {greetingText}
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * The aperture mark. When animated, the blades open (rotating outward under the
 * ring) to reveal a cursive "h", hold, then close again; see .halo-blades and
 * .halo-script in globals.css. Reduced-motion users see the still aperture.
 * @param {{ ink?: string, size?: number, animated?: boolean }} props
 */
export function LogoMark({ ink = 'var(--halo-ink)', size = 30, animated = true }) {
  const clipId = useId();
  // Blade strokes keep their on-screen width while the blades scale outward
  const bladeWidth = `${(size * 0.055).toFixed(2)}px`;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <circle cx="20" cy="20" r="15.9" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g className={animated ? 'halo-blades' : undefined}>
          <path
            d={APERTURE}
            stroke={ink}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: bladeWidth }}
          />
        </g>
      </g>
      {animated && (
        <g className="halo-script">
          <path d={SCRIPT_H} stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {/* Ring drawn last so it covers the blade ends */}
      <circle cx="20" cy="20" r="17.4" stroke="var(--halo-gold)" strokeWidth="3" />
    </svg>
  );
}
