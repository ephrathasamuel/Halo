import { readStorage } from './readStorage';
import { writeStorage } from './writeStorage';
import { STORAGE_KEYS } from './keys';
import {
  seedUsers,
  seedProviders,
  seedListings,
  seedPortfolio,
  seedBookings,
  seedEventRequests,
  seedQuotes,
  seedReviews,
  seedDisputes,
  seedAnnouncements,
} from './seed';

/**
 * Seed data map: storage key -> seed data array.
 */
const SEED_MAP = {
  [STORAGE_KEYS.USERS]: seedUsers,
  [STORAGE_KEYS.PROVIDERS]: seedProviders,
  [STORAGE_KEYS.LISTINGS]: seedListings,
  [STORAGE_KEYS.PORTFOLIO]: seedPortfolio,
  [STORAGE_KEYS.BOOKINGS]: seedBookings,
  [STORAGE_KEYS.EVENT_REQUESTS]: seedEventRequests,
  [STORAGE_KEYS.QUOTES]: seedQuotes,
  [STORAGE_KEYS.REVIEWS]: seedReviews,
  [STORAGE_KEYS.DISPUTES]: seedDisputes,
  [STORAGE_KEYS.ANNOUNCEMENTS]: seedAnnouncements,
};

/*
 * Bump when the seed gains new records or new fields. Browsers holding older
 * data then get the new records added and missing fields filled in, without
 * losing anything they created or changed.
 */
const SEED_VERSION = 3; // 2: countries, regional admins, Kenyan provider. 3: items for sale
const SEED_VERSION_KEY = 'halo_seed_version';

/**
 * Adds seed records missing from `stored` (matched by id) and fills fields that
 * exist in the seed but are absent on a stored record. Never overwrites a value.
 * @param {Array<object>} stored
 * @param {Array<object>} seed
 * @returns {{ merged: Array<object>, changed: boolean }}
 */
export function mergeSeed(stored, seed) {
  const byId = new Map(stored.map((r) => [r.id, r]));
  let changed = false;
  const merged = stored.map((record) => {
    const seedRecord = seed.find((s) => s.id === record.id);
    if (!seedRecord) return record;
    const missing = Object.keys(seedRecord).filter((k) => !(k in record));
    if (missing.length === 0) return record;
    changed = true;
    return { ...record, ...Object.fromEntries(missing.map((k) => [k, seedRecord[k]])) };
  });
  for (const seedRecord of seed) {
    if (!byId.has(seedRecord.id)) {
      merged.push(seedRecord);
      changed = true;
    }
  }
  return { merged, changed };
}

/**
 * Initialize demo data. Seeds keys that are absent, and upgrades older saved
 * data to the current seed version. Never overwrites existing values.
 * @returns {string[]} Recovery messages (if any corrupted data was found)
 */
export function initializeDemoData() {
  if (typeof window === 'undefined') return [];

  const recoveryMessages = [];
  const { data: storedVersion } = readStorage(SEED_VERSION_KEY, 0);
  const upgrade = Number(storedVersion) < SEED_VERSION;

  for (const [key, seedData] of Object.entries(SEED_MAP)) {
    const { data, recovered } = readStorage(key, null);
    if (recovered) {
      recoveryMessages.push(`Some saved data in this browser was damaged and has been reset.`);
    }
    if (data === null) {
      writeStorage(key, seedData);
    } else if (upgrade && Array.isArray(data)) {
      const { merged, changed } = mergeSeed(data, seedData);
      if (changed) writeStorage(key, merged);
    }
  }
  if (upgrade) writeStorage(SEED_VERSION_KEY, SEED_VERSION);

  return recoveryMessages;
}

/**
 * Reset all demo data. Clears and re-seeds everything.
 * Development-only control.
 */
export function resetDemoData() {
  if (typeof window === 'undefined') return;

  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  initializeDemoData();
}
