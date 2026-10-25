'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const refresh = useCallback(() => {
    const result = readStorage(key, fallback, storageType);
    setState(result);
  }, [key, fallback, storageType]);

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
