'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { readStorage } from '@/lib/storage/readStorage';

/**
 * Hook to read data from storage and re-read when storage changes.
 * @param {string} key - Storage key
 * @param {*} fallback - Default value
 * @param {'local' | 'session'} [storageType='local']
 * @returns {{ data: *, recovered: boolean, refresh: () => void }}
 */
export function useStorageSync(key, fallback, storageType = 'local') {
  const [state, setState] = useState({ data: fallback, recovered: false });

  // Callers usually pass an inline literal (e.g. `[]`), which is a new reference
  // every render. Keep it in a ref so `refresh` stays stable and the effect below
  // doesn't re-run (and setState) on every render.
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const refresh = useCallback(() => {
    const result = readStorage(key, fallbackRef.current, storageType);
    setState(result);
  }, [key, storageType]);

  useEffect(() => {
    refresh();

    const handleStorage = (e) => {
      if (e.key === key || e.key === null) {
        refresh();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, refresh]);

  return { ...state, refresh };
}
