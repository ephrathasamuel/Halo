import { describe, it, expect, beforeEach } from 'vitest';
import { createBooking } from '@/lib/domain/bookings';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { seedUsers, seedProviders, seedListings, USER_IDS, PROVIDER_IDS, LISTING_IDS } from '@/lib/storage/seed';

// Rules added when Halo moved to a server: the browser can't set prices or owners.
describe('Bookings use stored prices, never the ones sent', () => {
  const signInAs = (userId, roles) =>
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ userId, roles, status: 'active' }));

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    writeStorage(STORAGE_KEYS.USERS, seedUsers);
    writeStorage(STORAGE_KEYS.PROVIDERS, seedProviders);
    writeStorage(STORAGE_KEYS.LISTINGS, seedListings);
    writeStorage(STORAGE_KEYS.BOOKINGS, []);
  });

  const studio = seedListings.find((l) => l.id === LISTING_IDS.bLightMainStudio);
  const provider = seedProviders.find((p) => p.id === PROVIDER_IDS.bLight);

  it('a made-up hourly rate and owner are replaced by the stored ones', () => {
    signInAs(USER_IDS.renter1, ['renter']);
    const result = createBooking({
      providerId: PROVIDER_IDS.bLight,
      ownerId: USER_IDS.renter1,
      date: '2027-03-10',
      startTime: '10:00',
      endTime: '13:00',
      hours: 3,
      items: [{ listingId: studio.id, type: 'studio', qty: 1, rateSnapshot: 1, deposit: 0 }],
    });
    expect(result.ok).toBe(true);
    expect(result.data.items[0].rateSnapshot).toBe(studio.hourlyRate);
    expect(result.data.items[0].lineTotal).toBe(studio.hourlyRate * 3);
    expect(result.data.ownerId).toBe(provider.ownerId);
  });

  it('items from another provider are refused', () => {
    signInAs(USER_IDS.renter1, ['renter']);
    const other = seedListings.find((l) => l.providerId !== PROVIDER_IDS.bLight && l.type === 'equipment' && l.status === 'approved');
    const result = createBooking({
      providerId: PROVIDER_IDS.bLight,
      date: '2027-03-11',
      startTime: '10:00',
      endTime: '12:00',
      hours: 2,
      items: [{ listingId: other.id, type: 'equipment', qty: 1, rateSnapshot: 1 }],
    });
    expect(result.ok).toBe(false);
  });

  it("an owner can't book their own listing", () => {
    signInAs(provider.ownerId, ['owner', 'renter']);
    const result = createBooking({
      providerId: PROVIDER_IDS.bLight,
      date: '2027-03-12',
      startTime: '10:00',
      endTime: '12:00',
      hours: 2,
      items: [{ listingId: studio.id, type: 'studio', qty: 1 }],
    });
    expect(result.ok).toBe(false);
  });
});
