'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCountry } from '@/lib/geo';

const STORAGE_KEY = 'halo-country';
const CHANGE_EVENT = 'halo-country-change';

/** Saved country code, or '' for all countries (the default). */
function readCountry() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && getCountry(saved)) return saved;
  } catch {
    // storage blocked: show every country
  }
  return '';
}

/**
 * The country the visitor is browsing. Defaults to '' (all countries), so every
 * provider shows until the visitor narrows it down in the header. There is no
 * automatic guess: time zones are shared between countries (Windows reports
 * Ethiopia as "Africa/Nairobi"), so a guess would hide the visitor's own country.
 *
 * Changing it in one place updates every component using this hook, and the
 * choice is remembered. `country` is null until mounted, because the server
 * can't know it.
 * @returns {{ country: string|null, setCountry: (code: string) => void }}
 */
export function useCountry() {
  const [country, setCountryState] = useState(null);

  useEffect(() => {
    setCountryState(readCountry());
    const onChange = () => setCountryState(readCountry());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  /** @param {string} code country code, or '' for all countries */
  const setCountry = useCallback((code) => {
    if (code && !getCountry(code)) return;
    try {
      if (code) localStorage.setItem(STORAGE_KEY, code);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore: the choice still applies to this page
    }
    setCountryState(code);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { country, setCountry };
}
