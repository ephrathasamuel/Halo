/**
 * Safely write JSON to storage.
 * Handles quota errors and other storage exceptions.
 * @param {string} key - Storage key
 * @param {*} value - Value to serialize and store
 * @param {'local' | 'session'} [storageType='local'] - Which storage to write to
 * @returns {{ ok: boolean, error?: string }}
 */
export function writeStorage(key, value, storageType = 'local') {
  try {
    if (typeof window === 'undefined') {
      return { ok: false, error: 'Storage is not available on the server' };
    }
    const storage = storageType === 'session' ? sessionStorage : localStorage;
    storage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (err) {
    const message =
      err?.name === 'QuotaExceededError'
        ? 'Storage quota exceeded. Please clear some data and try again.'
        : `Storage write failed: ${err?.message || 'Unknown error'}`;
    console.error(`[Halo Storage] Write failed for "${key}":`, message);
    return { ok: false, error: message };
  }
}
