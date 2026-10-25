import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getCurrentSession } from './auth';
import { generateId } from '@/lib/ids';
import { transitionBooking } from './bookings';
import { advanceEvent } from './events';

/**
 * Submit a customer review for a completed booking or delivered event.
 * Guarded write: session -> renter role -> completed state -> one review rule.
 *
 * @param {{
 *   targetType: 'booking' | 'event',
 *   targetId: string,
 *   rating: number,
 *   comment: string
 * }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function createReview(input) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in: Sign in to leave a review' };

  const isRenter = session.roles?.includes('renter');
  if (!isRenter) return { ok: false, error: 'Not allowed: Requires renter role to leave reviews' };

  const rating = Number(input.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Rating must be an integer between 1 and 5 stars' };
  }
  if (!input.comment?.trim()) {
    return { ok: false, error: 'Review comment is required' };
  }

  const { data: reviews } = readStorage(STORAGE_KEYS.REVIEWS, []);

  // Check if a review already exists for this target (Rule 2.5: one per completed target)
  const existing = reviews.find(
    (r) => r.targetType === input.targetType && r.targetId === input.targetId
  );
  if (existing) {
    return { ok: false, error: 'A review has already been submitted for this booking/event' };
  }

  let providerId;
  let ownerId;

  if (input.targetType === 'booking') {
    const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
    const booking = bookings.find((b) => b.id === input.targetId);
    if (!booking) return { ok: false, error: 'Booking not found' };

    if (booking.renterId !== session.userId) {
      return { ok: false, error: 'Not yours: You can only review your own bookings' };
    }
    if (booking.status !== 'completed') {
      return { ok: false, error: `Cannot review booking in ${booking.status} state. Must be completed.` };
    }

    providerId = booking.providerId;
    ownerId = booking.ownerId;

    // Transition booking state to reviewed
    transitionBooking(booking.id, 'reviewed');
  } else if (input.targetType === 'event') {
    const { data: events } = readStorage(STORAGE_KEYS.EVENT_REQUESTS, []);
    const eventReq = events.find((e) => e.id === input.targetId);
    if (!eventReq) return { ok: false, error: 'Event request not found' };

    if (eventReq.renterId !== session.userId) {
      return { ok: false, error: 'Not yours: You can only review your own events' };
    }
    if (eventReq.status !== 'delivered') {
      return { ok: false, error: `Cannot review event in ${eventReq.status} state. Must be delivered.` };
    }

    providerId = eventReq.providerId;
    ownerId = eventReq.ownerId;

    // Advance event state to reviewed
    advanceEvent(eventReq.id, 'reviewed');
  } else {
    return { ok: false, error: 'Invalid review target type' };
  }

  const newReview = {
    id: generateId(),
    targetType: input.targetType,
    targetId: input.targetId,
    providerId,
    renterId: session.userId,
    ownerId,
    rating: Math.round(rating),
    comment: input.comment.trim(),
    ownerReply: null,
    createdAt: new Date().toISOString(),
  };

  const updatedReviews = [newReview, ...reviews];
  const res = writeStorage(STORAGE_KEYS.REVIEWS, updatedReviews);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: newReview };
}

/**
 * Reply to a customer review as provider owner.
 * Guarded write: owner only, allowed once per review.
 *
 * @param {{
 *   reviewId: string,
 *   ownerReply: string
 * }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function replyToReview(input) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const isOwner = session.roles?.includes('owner');
  const isAdmin = session.roles?.includes('admin');
  if (!isOwner && !isAdmin) return { ok: false, error: 'Not allowed: Requires owner role' };

  if (!input.ownerReply?.trim()) return { ok: false, error: 'Reply text cannot be empty' };

  const { data: reviews } = readStorage(STORAGE_KEYS.REVIEWS, []);
  const review = reviews.find((r) => r.id === input.reviewId);
  if (!review) return { ok: false, error: 'Review not found' };

  if (review.ownerId !== session.userId && !isAdmin) {
    return { ok: false, error: 'Not yours: You do not own the provider for this review' };
  }

  // Rule 2.5: owner reply allowed once
  if (review.ownerReply) {
    return { ok: false, error: 'You have already replied to this review. Only one reply is allowed.' };
  }

  const updatedReview = {
    ...review,
    ownerReply: input.ownerReply.trim(),
    repliedAt: new Date().toISOString(),
  };

  const updated = reviews.map((r) => (r.id === review.id ? updatedReview : r));
  const res = writeStorage(STORAGE_KEYS.REVIEWS, updated);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: updatedReview };
}

/**
 * Get reviews for the current owner's provider.
 * @returns {Array<object>}
 */
export function getReviewsForOwner() {
  const session = getCurrentSession();
  if (!session) return [];

  const { data: reviews } = readStorage(STORAGE_KEYS.REVIEWS, []);
  const isAdmin = session.roles?.includes('admin');
  if (isAdmin) return reviews;

  return reviews.filter((r) => r.ownerId === session.userId);
}
