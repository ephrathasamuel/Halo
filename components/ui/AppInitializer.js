'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DATA_EVENT, currentSession, installClientCache, reloadData } from '@/lib/client/cache';

/**
 * Loads Halo's data from the server when the app starts, and keeps it fresh:
 * again when the tab comes back into view, and every 20 seconds while it is
 * open (so a booking someone else made shows up).
 */
export function AppInitializer() {
  const pathname = usePathname();
  const router = useRouter();

  // Someone signed in with a password an admin gave them picks their own first.
  useEffect(() => {
    const check = () => {
      if (currentSession()?.mustChangePassword && pathname !== '/account') router.replace('/account');
    };
    check();
    window.addEventListener(DATA_EVENT, check);
    return () => window.removeEventListener(DATA_EVENT, check);
  }, [pathname, router]);

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
