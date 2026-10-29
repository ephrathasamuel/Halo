'use client';

import { useEffect, useState } from 'react';
import { DATA_EVENT, isLoaded } from '@/lib/client/cache';

/**
 * False during the server render and until Halo's data has arrived from the
 * server; true after that. Pages that read data wait for this before reading
 * (so the first client render matches the server HTML and nothing is judged
 * "missing" before it loaded). The component also re-renders every time the
 * data is reloaded, so what it reads stays current.
 * @returns {boolean}
 */
export function useHydrated() {
  const [ready, setReady] = useState(false);
  const [, setVersion] = useState(0);
  useEffect(() => {
    const update = () => {
      setReady(isLoaded());
      setVersion((v) => v + 1);
    };
    update();
    window.addEventListener(DATA_EVENT, update);
    return () => window.removeEventListener(DATA_EVENT, update);
  }, []);
  return ready;
}
