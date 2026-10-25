'use client';

import { useEffect, useState } from 'react';
import { dominantColor, readableBackground } from '@/lib/media';

/** "Nairobi Light Works" -> "NL", "B Light" -> "BL", "Halo" -> "H" */
function initials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return (words[0][0] + (words[1]?.[0] || '')).toUpperCase();
}

/**
 * A provider's logo. When they haven't uploaded one, Halo generates one: their
 * initials on the dominant colour of their cover photo (or their brand colour),
 * darkened as needed so the white letters stay readable.
 * @param {{ provider: object, size?: number, className?: string, rounded?: string }} props
 */
export function ProviderLogo({ provider, size = 40, className = '', rounded = 'rounded-xl' }) {
  const [broken, setBroken] = useState(false);
  const [coverColour, setCoverColour] = useState(null);
  const hasLogo = Boolean(provider?.logo) && !broken;

  useEffect(() => {
    let alive = true;
    if (!hasLogo && provider?.cover) {
      dominantColor(provider.cover).then((c) => alive && setCoverColour(c));
    }
    return () => {
      alive = false;
    };
  }, [hasLogo, provider?.cover]);

  const box = { width: size, height: size };

  if (hasLogo) {
    return (
      <img
        src={provider.logo}
        alt={`${provider.name} logo`}
        style={box}
        onError={() => setBroken(true)}
        className={`shrink-0 object-cover bg-halo-surface ${rounded} ${className}`}
      />
    );
  }

  const background = readableBackground(coverColour || provider?.brandColor || '#16181d');
  return (
    <span
      role="img"
      aria-label={`${provider?.name || 'Provider'} logo`}
      style={{ ...box, backgroundColor: background, fontSize: Math.round(size * 0.38) }}
      className={`shrink-0 inline-flex items-center justify-center font-semibold tracking-wide text-white ${rounded} ${className}`}
    >
      {initials(provider?.name)}
    </span>
  );
}

/** Stable colour for a person's initials, picked from their name. */
const AVATAR_COLOURS = ['#7c4a1e', '#1f5f7a', '#5b3f8c', '#2f6b3b', '#8a2f4b', '#3d4a6b', '#7a5a12'];

/**
 * A person's profile picture, or their initials on a colour picked from their name.
 * @param {{ user: { name?: string, avatar?: string }, size?: number, className?: string }} props
 */
export function UserAvatar({ user, size = 36, className = '' }) {
  const [broken, setBroken] = useState(false);
  const box = { width: size, height: size };
  if (user?.avatar && !broken) {
    return (
      <img
        src={user.avatar}
        alt=""
        style={box}
        onError={() => setBroken(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  const name = user?.name || '?';
  const colour = AVATAR_COLOURS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLOURS.length];
  return (
    <span
      aria-hidden="true"
      style={{ ...box, backgroundColor: colour, fontSize: Math.round(size * 0.42) }}
      className={`shrink-0 inline-flex items-center justify-center rounded-full font-semibold text-white ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
