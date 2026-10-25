'use client';

import { useMemo } from 'react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { countryName, providerLocation } from '@/lib/geo';

/**
 * The signed-in admin's reach: null country = global admin (everything).
 * @returns {{ country: string|null, isGlobal: boolean, label: string }}
 */
export function useAdminScope() {
  const { session } = useSession();
  const isGlobal = Boolean(session?.roles?.includes('admin'));
  const country = isGlobal ? null : session?.adminScope?.country || null;
  return { country, isGlobal, label: isGlobal ? 'All countries' : countryName(country) };
}

/**
 * Drop-in replacement for useStorageSync(key, []) on admin pages: same
 * { data, refresh } shape, but a regional admin only gets records from their
 * country. Providers and users carry a country; listings, bookings, event
 * requests and reviews follow their provider; disputes follow the booking or
 * event they are about. (The domain layer enforces the same rule on writes.)
 * @param {string} key one of STORAGE_KEYS
 * @returns {{ data: Array<object>, refresh: () => void }}
 */
export function useScopedStorage(key) {
  const { country } = useAdminScope();
  const { data, refresh } = useStorageSync(key, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: events } = useStorageSync(STORAGE_KEYS.EVENT_REQUESTS, []);

  const scoped = useMemo(() => {
    if (!country) return data;
    const providerCountry = new Map(providers.map((p) => [p.id, providerLocation(p).country]));
    const inCountry = (providerId) => (providerCountry.get(providerId) || 'ET') === country;

    switch (key) {
      case STORAGE_KEYS.PROVIDERS:
        return data.filter((p) => providerLocation(p).country === country);
      case STORAGE_KEYS.USERS:
        return data.filter((u) => (u.country || 'ET') === country && !u.roles?.includes('admin'));
      case STORAGE_KEYS.DISPUTES: {
        const owner = new Map([...bookings, ...events].map((r) => [r.id, r.providerId]));
        return data.filter((d) => inCountry(owner.get(d.targetId)));
      }
      case STORAGE_KEYS.ANNOUNCEMENTS:
        return data;
      default:
        // listings, bookings, event requests, quotes with providerId, reviews
        return data.filter((r) => !('providerId' in r) || inCountry(r.providerId));
    }
  }, [country, key, data, providers, bookings, events]);

  return { data: scoped, refresh };
}
