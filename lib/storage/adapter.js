/*
 * Where readStorage/writeStorage really read and write.
 *
 * With no adapter (unit tests, the original demo) they use the browser's
 * localStorage/sessionStorage. The app installs one of two adapters:
 *   - on the server (lib/server/store.js): the shared database, and the signed
 *     session cookie for the session key;
 *   - in the browser (lib/client/cache.js): a read-only copy of what the server
 *     sent this visitor. Changes go through server actions, never straight to
 *     storage.
 * An adapter answers only for the keys it handles (adapter.handles); anything
 * else (e.g. the checkout draft) keeps using browser storage.
 */
export function getStorageAdapter() {
  return globalThis.__haloStorageAdapter || null;
}

export function setStorageAdapter(adapter) {
  globalThis.__haloStorageAdapter = adapter;
}
