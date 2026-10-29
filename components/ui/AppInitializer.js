'use client';

import { useEffect } from 'react';
import { installClientCache, reloadData } from '@/lib/client/cache';

/**
 * Loads Halo's data from the server when the app starts, and keeps it fresh:
 * again when the tab comes back into view, and every 20 seconds while it is
 * open (so a booking someone else made shows up).
 */
export function AppInitializer() {
  useEffect(() => {
    installClientCache();
    reloadData();
    const onVisible = () => document.visibilityState === 'visible' && reloadData();
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => document.visibilityState === 'visible' && reloadData(), 20000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  return null;
}
