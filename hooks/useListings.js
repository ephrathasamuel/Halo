'use client';

import { useStorageSync } from './useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';

/**
 * Hook to get listings from storage.
 * @param {object} [options]
 * @param {boolean} [options.publicOnly=false] - If true, only return approved listings from approved providers
 * @returns {{ listings: Array, refresh: () => void }}
 */
export function useListings({ publicOnly = false } = {}) {
  const { data: listings, refresh } = useStorageSync(STORAGE_KEYS.LISTINGS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);

  if (!publicOnly) {
    return { listings, refresh };
  }

  // Filter for public visibility
  const approvedProviderIds = new Set(
    providers
      .filter((p) => p.status === 'approved')
      .filter((p) => {
        const owner = users.find((u) => u.id === p.ownerId);
        return owner && owner.status === 'active';
      })
      .map((p) => p.id)
  );

  const publicListings = listings.filter(
    (l) => l.status === 'approved' && approvedProviderIds.has(l.providerId)
  );

  return { listings: publicListings, refresh };
}
