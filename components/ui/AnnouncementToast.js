'use client';

import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';

const VISIBLE_MS = 90 * 1000;
const FADE_MS = 700;

/**
 * Announcement bar across the full width, right under the header. The whole
 * message is shown (on a phone it wraps onto more lines). Fades out by itself after 90 seconds (or when closed) and stays hidden for the
 * rest of the browser session.
 * @param {{ announcement: { id?: string, title: string, message: string } }} props
 */
export function AnnouncementToast({ announcement }) {
  const storageKey = `halo-announcement-seen-${announcement.id || announcement.title}`;
  const [state, setState] = useState('hidden'); // hidden | shown | leaving

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(storageKey) === '1';
    } catch {
      // storage blocked: just show it
    }
    if (seen) return undefined;

    setState('shown');
    const timer = setTimeout(() => setState('leaving'), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    if (state !== 'leaving') return undefined;
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch {
      // ignore
    }
    const timer = setTimeout(() => setState('hidden'), FADE_MS);
    return () => clearTimeout(timer);
  }, [state, storageKey]);

  if (state === 'hidden') return null;

  const title = announcement.title?.trim() || '';
  const endsWithPunctuation = /[.!?]$/.test(title);

  return (
    <div
      role="status"
      className={`w-full border-b border-halo-border bg-halo-ink text-white transition-opacity duration-700 ${
        state === 'leaving' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-start gap-3">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-halo-gold" aria-hidden="true" />
        <p className="flex-1 min-w-0 text-sm leading-relaxed break-words">
          <span className="font-semibold">
            {title}
            {endsWithPunctuation ? '' : '.'}
          </span>{' '}
          <span className="text-white/80">{announcement.message}</span>
        </p>
        <button
          type="button"
          onClick={() => setState('leaving')}
          className="-my-2 -mr-2 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white min-h-[36px] min-w-[36px]"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
