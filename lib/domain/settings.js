import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getCurrentSession } from './auth';

const PLATFORM = 'platform';
const DEFAULT_PAUSE_MESSAGE = 'Halo is not taking new bookings right now. Please check back soon.';

/**
 * Platform-wide settings (one record). Everyone can read them.
 * @returns {{ id: string, bookingsPaused: boolean, pauseMessage: string }}
 */
export function getPlatformSettings() {
  const { data: settings } = readStorage(STORAGE_KEYS.SETTINGS, []);
  return { id: PLATFORM, bookingsPaused: false, pauseMessage: '', ...(settings.find((s) => s.id === PLATFORM) || {}) };
}

/**
 * Why new bookings, quote requests and purchases are refused right now, or null.
 * @returns {string|null}
 */
export function bookingsPausedReason() {
  const settings = getPlatformSettings();
  return settings.bookingsPaused ? settings.pauseMessage || DEFAULT_PAUSE_MESSAGE : null;
}

/**
 * Global admin: pause or resume new bookings across Halo, with a message for customers.
 * Bookings already made carry on as usual.
 * @param {{ paused: boolean, message?: string }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function setBookingsPaused(input) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };
  if (!session.roles?.includes('admin')) return { ok: false, error: 'Not allowed: Requires admin role' };

  const message = String(input?.message || '').trim().slice(0, 300);
  const updated = {
    ...getPlatformSettings(),
    bookingsPaused: Boolean(input?.paused),
    pauseMessage: message,
    updatedAt: new Date().toISOString(),
    updatedBy: session.userId,
  };
  const { data: settings } = readStorage(STORAGE_KEYS.SETTINGS, []);
  const res = writeStorage(STORAGE_KEYS.SETTINGS, [...settings.filter((s) => s.id !== PLATFORM), updated]);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: updated };
}
