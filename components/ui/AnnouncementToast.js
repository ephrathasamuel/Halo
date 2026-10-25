'use client';

import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';

const VISIBLE_MS = 90 * 1000;
const FADE_MS = 700;

/**
 * Frosted, see-through announcement that floats over the hero photo.
 * Fades out by itself after 90 seconds (or when closed) and stays hidden for the
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
      className={`pointer-events-auto w-full lg:max-w-md rounded-2xl border border-on-photo/20 bg-on-photo/10 px-4 py-3 text-on-photo backdrop-blur-md transition-all duration-700 ${
        state === 'leaving' ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-halo-gold" aria-hidden="true" />
        <p className="flex-1 text-sm leading-relaxed line-clamp-2 lg:line-clamp-none">
          <span className="font-semibold">
            {title}
            {endsWithPunctuation ? '' : '.'}
          </span>{' '}
          <span className="text-on-photo/80">{announcement.message}</span>
        </p>
        <button
          type="button"
          onClick={() => setState('leaving')}
          className="-my-2 -mr-2 flex items-center justify-center rounded-lg text-on-photo/70 hover:bg-on-photo/10 hover:text-on-photo min-h-[36px] min-w-[36px]"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
