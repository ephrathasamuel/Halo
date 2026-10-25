'use client';

import { useStorageSync } from './useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';

/**
 * Hook to get bookings from storage.
 * @returns {{ bookings: Array, refresh: () => void }}
 */
export function useBookings() {
  const { data: bookings, refresh } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  return { bookings, refresh };
}
