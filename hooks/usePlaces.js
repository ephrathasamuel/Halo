'use client';

import { useEffect, useState } from 'react';
import { loadPlaces } from '@/lib/geo';

/**
 * Regions and cities for one country, loaded on demand.
 * @param {string} countryCode '' or null loads nothing
 * @returns {{ places: import('@/lib/geo').Places | null, loading: boolean, error: string }}
 */
export function usePlaces(countryCode) {
  const [state, setState] = useState({ code: '', places: null, error: '' });

  useEffect(() => {
    if (!countryCode) return undefined;
    let live = true;
    loadPlaces(countryCode)
      .then((places) => live && setState({ code: countryCode, places, error: '' }))
      .catch(() => live && setState({ code: countryCode, places: null, error: 'Could not load places. Check your connection.' }));
    return () => {
      live = false;
    };
  }, [countryCode]);

  if (!countryCode) return { places: null, loading: false, error: '' };
  const current = state.code === countryCode;
  return { places: current ? state.places : null, loading: !current, error: current ? state.error : '' };
}
