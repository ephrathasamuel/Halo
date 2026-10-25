import { describe, it, expect, beforeEach } from 'vitest';
import { createBooking, cancelBooking, getBookingById } from '@/lib/domain/bookings';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import {
  seedUsers,
  seedProviders,
  seedListings,
  seedBookings,
  USER_IDS,
  PROVIDER_IDS,
  LISTING_IDS,
  BOOKING_IDS,
} from '@/lib/storage/seed';
import { calculateBookingPrice } from '@/lib/rules/pricing';

describe('Phase 3 Booking Engine & Negative Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    writeStorage(STORAGE_KEYS.USERS, seedUsers);
    writeStorage(STORAGE_KEYS.PROVIDERS, seedProviders);
    writeStorage(STORAGE_KEYS.LISTINGS, seedListings);
    writeStorage(STORAGE_KEYS.BOOKINGS, seedBookings);
  });

  // Negative Test 1: Signed-out write
  it('Negative Test 1: calling createBooking without session returns "Not signed in"', () => {
    // Ensure no session
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);

    const result = createBooking({
      providerId: PROVIDER_IDS.bLight,
      ownerId: USER_IDS.meronTadesse,
      date: '2026-12-01',
      startTime: '10:00',
      endTime: '14:00',
      hours: 4,
      items: [
        {
          listingId: LISTING_IDS.bLightMainStudio,
          type: 'studio',
          qty: 1,
          rateSnapshot: 600,
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Not signed in');
  });

  // Negative Test 2: Cross-user cancel
  it('Negative Test 2: renter A cancelling renter B\'s booking returns "Not yours"', () => {
    // Sign in as renter 1
    sessionStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        userId: USER_IDS.renter1,
        roles: ['renter'],
      })
    );

    // Try to cancel confirmed booking owned by renter 2
    const result = cancelBooking(BOOKING_IDS.confirmed);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Not yours');
  });

  // Suspended user check
  it('blocks suspended users from creating bookings', () => {
    sessionStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        userId: USER_IDS.suspended,
        roles: ['renter'],
      })
    );

    const result = createBooking({
      providerId: PROVIDER_IDS.bLight,
      ownerId: USER_IDS.meronTadesse,
      date: '2026-12-01',
      startTime: '10:00',
      endTime: '14:00',
      hours: 4,
      items: [
        {
          listingId: LISTING_IDS.bLightMainStudio,
          type: 'studio',
          qty: 1,
          rateSnapshot: 600,
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('suspended');
  });

  // Conflict detection: Studio overlap
  it('refuses overlapping studio bookings on confirmed slots', () => {
    sessionStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        userId: USER_IDS.renter1,
        roles: ['renter'],
      })
    );

    // Read the confirmed seed booking date and time (09:00 - 12:00)
    const confirmedBooking = seedBookings.find((b) => b.id === BOOKING_IDS.confirmed);
    expect(confirmedBooking).toBeDefined();

    // Try to book overlapping slot (10:00 - 13:00) on same date
    const result = createBooking({
      providerId: confirmedBooking.providerId,
      ownerId: confirmedBooking.ownerId,
      date: confirmedBooking.date,
      startTime: '10:00',
      endTime: '13:00',
      hours: 3,
      items: [
        {
          listingId: LISTING_IDS.bLightMainStudio,
          type: 'studio',
          qty: 1,
          rateSnapshot: 600,
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('unavailable');
  });

  // Equipment stock check
  it('refuses over-stock equipment requests', () => {
    sessionStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        userId: USER_IDS.renter1,
        roles: ['renter'],
      })
    );

    // Cinema camera has total stock of 2
    const result = createBooking({
      providerId: PROVIDER_IDS.bLight,
      ownerId: USER_IDS.meronTadesse,
      date: '2026-12-05',
      startTime: '10:00',
      endTime: '14:00',
      hours: 4,
      items: [
        {
          listingId: LISTING_IDS.bLightCinemaCamera,
          type: 'equipment',
          qty: 5, // Exceeds total quantity of 2
          rateSnapshot: 350,
          deposit: 5000,
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('exceeds total inventory');
  });

  // Pricing formula check
  it('correctly calculates subtotal, 10% fee, separate deposit, and total', () => {
    const calculation = calculateBookingPrice({
      items: [
        { rateSnapshot: 600, hours: 3, qty: 1, deposit: 0 }, // Studio: 1800
        { rateSnapshot: 150, hours: 3, qty: 2, deposit: 2000 }, // LED lights: 900, deposit: 4000
      ],
    });

    expect(calculation.subtotal).toBe(2700);
    expect(calculation.fee).toBe(270); // 10% of 2700
    expect(calculation.deposit).toBe(4000);
    expect(calculation.ownerEarnings).toBe(2430); // 2700 - 270
    expect(calculation.total).toBe(6970); // 2700 + 270 + 4000
  });

  // Unauthorized view check
  it('refuses unauthorized users from viewing another user\'s booking', () => {
    sessionStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        userId: USER_IDS.renter1,
        roles: ['renter'],
      })
    );

    // BOOKING_IDS.confirmed belongs to renter2
    const booking = getBookingById(BOOKING_IDS.confirmed);
    expect(booking).toBeNull();
  });
});
