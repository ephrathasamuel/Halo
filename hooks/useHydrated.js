'use client';

import { useEffect, useState } from 'react';

/**
 * False during the server render and the first client render, true after mount.
 *
 * Pages that read browser storage must wait for this before reading, otherwise the
 * first client render differs from the server HTML and React throws a hydration
 * error. When data moves to Supabase this becomes the "loading" flag for the fetch.
 * @returns {boolean}
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
