import { describe, it, expect, beforeEach } from 'vitest';
import { createBooking } from '@/lib/domain/bookings';
import { setBookingsPaused, getPlatformSettings } from '@/lib/domain/settings';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { seedUsers, seedProviders, seedListings, USER_IDS, PROVIDER_IDS, LISTING_IDS } from '@/lib/storage/seed';

// The admin's "Taking bookings" switch (like Addis Eats' "Taking orders").
describe('Pausing new bookings', () => {
  const signInAs = (userId, roles) =>
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ userId, roles, status: 'active' }));
  const book = () =>
    createBooking({
      providerId: PROVIDER_IDS.bLight,
      date: '2027-03-10',
      startTime: '10:00',
      endTime: '13:00',
      hours: 3,
      items: [{ listingId: LISTING_IDS.bLightMainStudio, type: 'studio', qty: 1 }],
    });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    writeStorage(STORAGE_KEYS.USERS, seedUsers);
    writeStorage(STORAGE_KEYS.PROVIDERS, seedProviders);
    writeStorage(STORAGE_KEYS.LISTINGS, seedListings);
    writeStorage(STORAGE_KEYS.BOOKINGS, []);
    writeStorage(STORAGE_KEYS.SETTINGS, []);
  });

  it('only a global admin can pause', () => {
    signInAs(USER_IDS.renter1, ['renter']);
    expect(setBookingsPaused({ paused: true }).ok).toBe(false);
    expect(getPlatformSettings().bookingsPaused).toBe(false);
  });

  it('while paused, bookings are refused with the admin message; resuming lets them through', () => {
    signInAs(USER_IDS.admin, ['admin']);
    expect(setBookingsPaused({ paused: true, message: 'Closed for the holiday.' }).ok).toBe(true);
    signInAs(USER_IDS.renter1, ['renter']);
    expect(book()).toEqual({ ok: false, error: 'Closed for the holiday.' });
    signInAs(USER_IDS.admin, ['admin']);
    setBookingsPaused({ paused: false });
    signInAs(USER_IDS.renter1, ['renter']);
    expect(book().ok).toBe(true);
  });
});
