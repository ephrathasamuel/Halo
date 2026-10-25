'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentSession } from '@/lib/domain/auth';
import { STORAGE_KEYS } from '@/lib/storage/keys';

/**
 * Hook to read and watch the current session.
 * @returns {{ session: object|null, isSignedIn: boolean, refresh: () => void }}
 */
export function useSession() {
  const [session, setSession] = useState(null);

  const refresh = useCallback(() => {
    const current = getCurrentSession();
    setSession(current);
  }, []);

  useEffect(() => {
    refresh();

    // Listen for storage changes (cross-tab)
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEYS.SESSION) {
        refresh();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refresh]);

  return {
    session,
    isSignedIn: session !== null,
    refresh,
  };
}
