'use client';

import { STORAGE_KEYS } from '@/lib/storage/keys';
import { setStorageAdapter } from '@/lib/storage/adapter';

/*
 * The browser's copy of Halo's data, loaded from the server (/api/halo/data).
 * Once installed, readStorage() in the browser reads this copy instead of
 * localStorage, so Halo's existing pages and read helpers keep working
 * unchanged. Writes never go here: they go through server actions
 * (lib/client/domain.js), after which the copy is reloaded.
 */

export const DATA_EVENT = 'halo-data-change';

const SHARED_KEYS = Object.values(STORAGE_KEYS).filter(
  (key) => key !== STORAGE_KEYS.SESSION && key !== STORAGE_KEYS.CHECKOUT_DRAFT
);

const state = {
  loaded: false,
  data: {},
  session: null,
  demo: false,
  loading: null,
};

function announce() {
  window.dispatchEvent(new Event(DATA_EVENT));
}

export function isLoaded() {
  return state.loaded;
}

export function isDemo() {
  return state.demo;
}

export function currentSession() {
  return state.session;
}

/** Fetches the latest data from the server and tells every listening page. */
export function reloadData() {
  if (state.loading) return state.loading;
  state.loading = fetch('/api/halo/data', { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
    .then((payload) => {
      state.data = payload.data || {};
      state.session = payload.session || null;
      state.demo = Boolean(payload.demo);
      state.loaded = true;
      announce();
    })
    .catch((error) => {
      console.warn('[halo] Could not load data from the server:', error.message);
    })
    .finally(() => {
      state.loading = null;
    });
  return state.loading;
}

let installed = false;

/** Points readStorage at this copy (called once, by AppInitializer). */
export function installClientCache() {
  if (installed) return;
  installed = true;
  setStorageAdapter({
    handles(key, storageType) {
      return key === STORAGE_KEYS.SESSION || (storageType !== 'session' && SHARED_KEYS.includes(key));
    },
    read(key, fallback) {
      if (key === STORAGE_KEYS.SESSION) return { data: state.session ?? fallback, recovered: false };
      return { data: key in state.data ? structuredClone(state.data[key]) : fallback, recovered: false };
    },
    write() {
      // Changes go through the server (lib/client/domain.js).
      return { ok: false, error: 'Please try again: changes are saved on the server.' };
    },
  });
}
