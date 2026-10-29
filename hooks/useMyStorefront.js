'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';

const CHOICE_KEY = 'halo_owner_storefront';
const CHOICE_EVENT = 'halo-storefront-change';

function readChoice() {
  try {
    return window.localStorage.getItem(CHOICE_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * The storefront the provider dashboard is showing. Most owners have one; an
 * account with several (e.g. the admin, who holds Halo's starting storefronts)
 * picks one with <StorefrontSwitcher />, remembered on this device.
 * @returns {{ provider: object|null, storefronts: object[], choose: (id: string) => void }}
 */
export function useMyStorefront() {
  const { session } = useSession();
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const [chosenId, setChosenId] = useState('');

  useEffect(() => {
    const read = () => setChosenId(readChoice());
    read();
    window.addEventListener(CHOICE_EVENT, read);
    return () => window.removeEventListener(CHOICE_EVENT, read);
  }, []);

  const storefronts = providers.filter((p) => p.ownerId === session?.userId);
  const provider = storefronts.find((p) => p.id === chosenId) || storefronts[0] || null;

  function choose(id) {
    try {
      window.localStorage.setItem(CHOICE_KEY, id);
    } catch {
      // Private window: the choice lasts until the page reloads.
    }
    setChosenId(id);
    window.dispatchEvent(new Event(CHOICE_EVENT));
  }

  return { provider, storefronts, choose };
}
