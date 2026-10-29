import { getStorageAdapter } from './adapter';

/**
 * Safely read and parse JSON from storage.
 * Never throws. Recovers to fallback on malformed or missing data.
 * @param {string} key - Storage key
 * @param {*} fallback - Default value if key is missing or malformed
 * @param {'local' | 'session'} [storageType='local'] - Which storage to read from
 * @returns {{ data: *, recovered: boolean }} The parsed data and whether recovery occurred
 */
export function readStorage(key, fallback, storageType = 'local') {
  const adapter = getStorageAdapter();
  if (adapter?.handles(key, storageType)) {
    return adapter.read(key, fallback, storageType);
  }
  try {
    if (typeof window === 'undefined') {
      return { data: fallback, recovered: false };
    }
    const storage = storageType === 'session' ? sessionStorage : localStorage;
    const raw = storage.getItem(key);
    if (raw === null) {
      return { data: fallback, recovered: false };
    }
    const parsed = JSON.parse(raw);
    return { data: parsed, recovered: false };
  } catch (err) {
    console.warn(
      `[Halo Storage] Recovered from malformed data in "${key}". Using fallback.`,
      err?.message
    );
    // Remove the corrupted key so seed can re-populate
    try {
      const storage = storageType === 'session' ? sessionStorage : localStorage;
      storage.removeItem(key);
    } catch {
      // ignore removal errors
    }
    return { data: fallback, recovered: true };
  }
}
