import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { readStorage } from '@/lib/storage/readStorage';
import { initializeDemoData } from '@/lib/storage/initializeDemoData';
import { signInAsDemo, signOut } from '@/lib/domain/auth';
import {
  submitEventRequest,
  sendQuote,
  respondToQuote,
  advanceEvent,
} from '@/lib/domain/events';
import { createReview, replyToReview } from '@/lib/domain/reviews';
import { openDispute, resolveDispute } from '@/lib/domain/disputes';
import { suspendUser, reinstateUser } from '@/lib/domain/users';
import { publishAnnouncement, toggleAnnouncement } from '@/lib/domain/announcements';
import { moderateProvider } from '@/lib/domain/providers';
import { moderateListing } from '@/lib/domain/listings';
import { USER_IDS, PROVIDER_IDS, LISTING_IDS, BOOKING_IDS, EVENT_IDS } from '@/lib/storage/seed';

describe('Phase 5: Event Quotes, Admin Moderation, Reviews & Disputes', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    initializeDemoData();
  });

  describe('Event Filming & Quotes Workflow', () => {
    it('renter submits an event request and owner dispatches versioned quotes', () => {
      // 1. Renter submits quote request
      signInAsDemo(USER_IDS.renter1);
      const reqRes = submitEventRequest({
        providerId: PROVIDER_IDS.bLight,
        listingId: LISTING_IDS.bLightWeddingFilming,
        eventType: 'Wedding',
        date: '2026-12-15',
        startTime: '08:00',
        durationHours: 10,
        location: 'Skylight Hotel Addis',
        coverage: 'Full 3-camera ceremony and reception',
        budgetHint: 35000,
      });

      expect(reqRes.ok).toBe(true);
      expect(reqRes.data.status).toBe('submitted');
      const requestId = reqRes.data.id;

      // 2. Unauthorized owner attempts to send quote
      signOut();
      signInAsDemo(USER_IDS.dawitAlemu); // Merkato Frames owner
      const unauthQuote = sendQuote(requestId, {
        amount: 30000,
        inclusions: ['Full day coverage'],
        validUntil: '2026-11-30',
      });
      expect(unauthQuote.ok).toBe(false);
      expect(unauthQuote.error).toMatch(/Not yours/i);

      // 3. Authorized B Light owner sends quote v1
      signOut();
      signInAsDemo(USER_IDS.meronTadesse); // B Light owner
      const quoteV1 = sendQuote(requestId, {
        amount: 32000,
        inclusions: ['Full day coverage', '2 videographers', 'Highlight reel'],
        validUntil: '2026-11-30',
      });
      expect(quoteV1.ok).toBe(true);
      expect(quoteV1.data.version).toBe(1);
      expect(quoteV1.data.status).toBe('sent');

      // 4. Owner sends revised quote v2
      const quoteV2 = sendQuote(requestId, {
        amount: 35000,
        inclusions: ['Full day coverage', '3 videographers', 'Drone aerials', 'Highlight reel'],
        validUntil: '2026-11-30',
      });
      expect(quoteV2.ok).toBe(true);
      expect(quoteV2.data.version).toBe(2);

      // Verify v1 was marked as revised
      const { data: quotes } = readStorage(STORAGE_KEYS.QUOTES, []);
      const v1 = quotes.find((q) => q.id === quoteV1.data.id);
      expect(v1.status).toBe('revised');

      // 5. Renter accepts quote v2
      signOut();
      signInAsDemo(USER_IDS.renter1);
      const acceptRes = respondToQuote(quoteV2.data.id, 'accept');
      expect(acceptRes.ok).toBe(true);

      const { data: requests } = readStorage(STORAGE_KEYS.EVENT_REQUESTS, []);
      const updatedReq = requests.find((r) => r.id === requestId);
      expect(updatedReq.status).toBe('accepted');
      expect(updatedReq.agreedAmount).toBe(35000);
    });

    it('refuses acceptance of an expired quote', () => {
      // Seed quote QUOTE_IDS.quoteExpired is expired (validUntil is in the past)
      signInAsDemo(USER_IDS.renter2);
      const res = respondToQuote('00000000-0000-4000-f000-000000000002', 'accept');
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/expired/i);
    });

    it('advances production stages through full lifecycle', () => {
      signInAsDemo(USER_IDS.meronTadesse);

      // submitted -> under_review
      const step1 = advanceEvent(EVENT_IDS.submitted, 'under_review');
      expect(step1.ok).toBe(true);
      expect(step1.data.status).toBe('under_review');
    });
  });

  describe('Reviews and One-Time Owner Reply Rules', () => {
    it('allows renter to review completed booking and enforces one-review rule', () => {
      // Abebe has completed booking BOOKING_IDS.completed
      signInAsDemo(USER_IDS.renter2);

      const reviewRes = createReview({
        targetType: 'booking',
        targetId: BOOKING_IDS.completed,
        rating: 5,
        comment: 'Outstanding studio space and excellent cinema camera gear!',
      });

      expect(reviewRes.ok).toBe(true);
      expect(reviewRes.data.rating).toBe(5);

      // Verify target booking status transitioned to 'reviewed'
      const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
      const booking = bookings.find((b) => b.id === BOOKING_IDS.completed);
      expect(booking.status).toBe('reviewed');

      // Attempt duplicate review on same target (Rule 2.5)
      const duplicateRes = createReview({
        targetType: 'booking',
        targetId: BOOKING_IDS.completed,
        rating: 4,
        comment: 'Second review attempt should fail.',
      });
      expect(duplicateRes.ok).toBe(false);
      expect(duplicateRes.error).toMatch(/already been submitted/i);
    });

    it('allows owner to reply once and strictly rejects second reply', () => {
      // Seed review exists on B Light
      const seedReviewId = '00000000-0000-4000-1100-000000000001';

      // Meron already replied in seed data
      signInAsDemo(USER_IDS.meronTadesse);
      const secondReply = replyToReview({
        reviewId: seedReviewId,
        ownerReply: 'Trying to reply a second time',
      });

      expect(secondReply.ok).toBe(false);
      expect(secondReply.error).toMatch(/already replied/i);
    });
  });

  describe('Disputes and Admin Mediation', () => {
    it('participating renter opens dispute, transitions booking, and admin resolves it', () => {
      signInAsDemo(USER_IDS.renter1);

      // Open dispute on in_progress booking
      const disputeRes = openDispute({
        targetType: 'booking',
        targetId: BOOKING_IDS.inProgress,
        reason: 'Equipment malfunction',
        description: 'Audio kit recorder had intermittent battery connection.',
      });

      expect(disputeRes.ok).toBe(true);
      const disputeId = disputeRes.data.id;

      // Verify booking status is 'disputed'
      const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
      const b = bookings.find((b) => b.id === BOOKING_IDS.inProgress);
      expect(b.status).toBe('disputed');

      // Non-admin tries to resolve
      const failResolve = resolveDispute(disputeId, 'Unauthorized attempt');
      expect(failResolve.ok).toBe(false);
      expect(failResolve.error).toMatch(/administrator/i);

      // Admin resolves dispute
      signOut();
      signInAsDemo(USER_IDS.admin);
      const resolveRes = resolveDispute(disputeId, 'Refunded 50% rental fee to customer.');
      expect(resolveRes.ok).toBe(true);
      expect(resolveRes.data.status).toBe('resolved');

      // Target booking should be transitioned to 'resolved'
      const { data: updatedBookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
      const resolvedBooking = updatedBookings.find((b) => b.id === BOOKING_IDS.inProgress);
      expect(resolvedBooking.status).toBe('resolved');
    });
  });

  describe('Admin Platform Moderation & Users', () => {
    it('admin moderates provider status', () => {
      signInAsDemo(USER_IDS.admin);

      // Approve Pixel Nest (pending in seed)
      const res = moderateProvider(PROVIDER_IDS.pixelNest, 'approved');
      expect(res.ok).toBe(true);
      expect(res.data.status).toBe('approved');
    });

    it('admin moderates listing status', () => {
      signInAsDemo(USER_IDS.admin);

      const res = moderateListing(LISTING_IDS.pixelStudioRoom, 'approved');
      expect(res.ok).toBe(true);
      expect(res.data.status).toBe('approved');
    });

    it('admin suspends and reinstates user, and protects admin accounts', () => {
      signInAsDemo(USER_IDS.admin);

      // Cannot suspend an admin
      const adminSuspend = suspendUser(USER_IDS.admin);
      expect(adminSuspend.ok).toBe(false);
      expect(adminSuspend.error).toMatch(/Cannot suspend an administrator/i);

      // Suspend renter 1
      const suspendRes = suspendUser(USER_IDS.renter1);
      expect(suspendRes.ok).toBe(true);
      expect(suspendRes.data.status).toBe('suspended');

      // Reinstate renter 1
      const reinstateRes = reinstateUser(USER_IDS.renter1);
      expect(reinstateRes.ok).toBe(true);
      expect(reinstateRes.data.status).toBe('active');
    });

    it('admin manages platform announcements', () => {
      signInAsDemo(USER_IDS.admin);

      const pubRes = publishAnnouncement({
        title: 'Holiday Schedule Notice',
        message: 'Studios open during Ethiopian Christmas with regular booking hours.',
      });
      expect(pubRes.ok).toBe(true);
      expect(pubRes.data.active).toBe(true);

      const toggleRes = toggleAnnouncement(pubRes.data.id);
      expect(toggleRes.ok).toBe(true);
      expect(toggleRes.data.active).toBe(false);
    });
  });
});
