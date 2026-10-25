'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentSession } from '@/lib/domain/auth';
import { STORAGE_KEYS } from '@/lib/storage/keys';

export const SESSION_CHANGE_EVENT = 'halo-session-change';

/**
 * Hook to read and watch the current session.
 * isLoaded is false until the session has been read from storage after mount;
 * guards must wait for it before deciding someone is signed out.
 * @returns {{ session: object|null, isSignedIn: boolean, isLoaded: boolean, refresh: () => void }}
 */
export function useSession() {
  const [session, setSession] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    const current = getCurrentSession();
    setSession(current);
    setIsLoaded(true);
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
    // Same-tab changes (profile edits) announce themselves with this event
    window.addEventListener(SESSION_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SESSION_CHANGE_EVENT, refresh);
    };
  }, [refresh]);

  return {
    session,
    isSignedIn: session !== null,
    isLoaded,
    refresh,
  };
}
