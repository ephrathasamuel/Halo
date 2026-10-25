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

/**
 * Initialize demo data. Seeds only keys that are absent.
 * Never overwrites existing data.
 * @returns {string[]} Recovery messages (if any corrupted data was found)
 */
export function initializeDemoData() {
  if (typeof window === 'undefined') return [];

  const recoveryMessages = [];

  for (const [key, seedData] of Object.entries(SEED_MAP)) {
    const { data, recovered } = readStorage(key, null);
    if (recovered) {
      recoveryMessages.push(`Recovered corrupted data for "${key}". Demo data has been restored.`);
    }
    if (data === null) {
      writeStorage(key, seedData);
    }
  }

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
