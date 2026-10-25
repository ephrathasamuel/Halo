import { describe, it, expect, beforeEach } from 'vitest';
import { initializeDemoData } from '@/lib/storage/initializeDemoData';
import { signInAsDemo, signOut } from '@/lib/domain/auth';
import { createBooking, cancelBooking } from '@/lib/domain/bookings';
import { respondToQuote } from '@/lib/domain/events';
import { createReview, replyToReview } from '@/lib/domain/reviews';
import { resolveDispute } from '@/lib/domain/disputes';
import { suspendUser } from '@/lib/domain/users';
import {
  USER_IDS,
  PROVIDER_IDS,
  LISTING_IDS,
  BOOKING_IDS,
  QUOTE_IDS,
  seedBookings,
  seedDisputes,
  seedReviews,
} from '@/lib/storage/seed';

describe('Part 4.1: Automated Negative Test Matrix (10 Strict Invariants)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    initializeDemoData();
  });

  // Negative Test 1: Signed-out write rejected
  it('Negative Test 1: Signed-out write returns "Not signed in"', () => {
    signOut();
    const result = createBooking({
      providerId: PROVIDER_IDS.bLight,
      ownerId: USER_IDS.meronTadesse,
      date: '2026-11-20',
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
    expect(result.error).toMatch(/Not signed in/i);
  });

  // Negative Test 2: Cross-user cancel rejected
  it('Negative Test 2: Cross-user cancel returns "Not yours"', () => {
    // BOOKING_IDS.confirmed belongs to renter2
    signInAsDemo(USER_IDS.renter1);
    const result = cancelBooking(BOOKING_IDS.confirmed);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Not yours/i);
  });

  // Negative Test 3: Suspended user action rejected
  it('Negative Test 3: Suspended user sign-in and actions rejected', () => {
    signOut();
    const loginResult = signInAsDemo(USER_IDS.suspended);
    expect(loginResult.ok).toBe(false);
    expect(loginResult.error).toMatch(/suspended/i);
  });

  // Negative Test 4: Buffer conflict rejected
  it('Negative Test 4: Studio booking within buffer conflict window is rejected', () => {
    // Find confirmed booking date for B Light Main Studio (30m buffer)
    const confirmedBooking = seedBookings.find((b) => b.id === BOOKING_IDS.confirmed);
    expect(confirmedBooking).toBeDefined();

    signInAsDemo(USER_IDS.renter1);
    // confirmedBooking runs 09:00 - 12:00 with 30m buffer (occupied 08:30 - 12:30)
    // Attempt to book 11:00 - 13:00 on the same date
    const result = createBooking({
      providerId: PROVIDER_IDS.bLight,
      ownerId: USER_IDS.meronTadesse,
      date: confirmedBooking.date,
      startTime: '11:00',
      endTime: '13:00',
      hours: 2,
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
    expect(result.error).toMatch(/unavailable|conflict/i);
  });

  // Negative Test 5: Over-stock equipment rental rejected
  it('Negative Test 5: Over-stock equipment request exceeding available quantity is rejected', () => {
    signInAsDemo(USER_IDS.renter1);
    // Cinema camera has quantity: 2 in seed data
    const result = createBooking({
      providerId: PROVIDER_IDS.bLight,
      ownerId: USER_IDS.meronTadesse,
      date: '2026-11-25',
      startTime: '10:00',
      endTime: '14:00',
      hours: 4,
      items: [
        {
          listingId: LISTING_IDS.bLightCinemaCamera,
          type: 'equipment',
          qty: 5, // Exceeds available stock of 2
          rateSnapshot: 350,
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/inventory|stock|exceeds/i);
  });

  // Negative Test 6: Expired quote acceptance rejected
  it('Negative Test 6: Accepting an expired quote returns "Quote has expired"', () => {
    signInAsDemo(USER_IDS.renter2);
    // QUOTE_IDS.quoteExpired is already in expired status in seed data
    const result = respondToQuote(QUOTE_IDS.quoteExpired, 'accept');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/expired/i);
  });

  // Negative Test 7: Duplicate review rejected
  it('Negative Test 7: Submitting a duplicate review on the same booking returns "already reviewed"', () => {
    // BOOKING_IDS.reviewed was already reviewed by renter Dawit Alemu
    signInAsDemo(USER_IDS.dawitAlemu);
    const result = createReview({
      targetType: 'booking',
      targetId: BOOKING_IDS.reviewed,
      providerId: PROVIDER_IDS.bLight,
      rating: 5,
      comment: 'Attempting duplicate review',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/already been submitted|already reviewed/i);
  });

  // Negative Test 8: Second owner reply rejected
  it('Negative Test 8: Submitting a second owner reply returns "already replied"', () => {
    // seedReviews[0] already has ownerReply populated
    const reviewWithReply = seedReviews[0];
    signInAsDemo(USER_IDS.meronTadesse); // B Light owner
    const result = replyToReview({
      reviewId: reviewWithReply.id,
      ownerReply: 'Second reply attempt',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/already replied/i);
  });

  // Negative Test 9: Non-admin dispute resolution rejected
  it('Negative Test 9: Non-admin attempting to resolve dispute returns "Only platform administrators"', () => {
    const dispute = seedDisputes[0];
    signInAsDemo(USER_IDS.renter1); // Renter, not admin
    const result = resolveDispute(dispute.id, 'Unauthorized resolution attempt');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/administrator|admin/i);
  });

  // Negative Test 10: Non-admin user suspension rejected
  it('Negative Test 10: Non-admin attempting user suspension returns "Requires admin role"', () => {
    signInAsDemo(USER_IDS.meronTadesse); // Owner, not admin
    const result = suspendUser(USER_IDS.renter1);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/admin/i);
  });
});
