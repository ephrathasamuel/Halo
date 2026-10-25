import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getCurrentSession } from './auth';
import { generateId } from '@/lib/ids';
import { transitionBooking } from './bookings';
import { advanceEvent } from './events';

/**
 * Open a dispute on a booking or event production.
 * Guarded write: must be participating renter or owner.
 *
 * @param {{
 *   targetType: 'booking' | 'event',
 *   targetId: string,
 *   reason: string,
 *   description: string
 * }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function openDispute(input) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in: Sign in to open a dispute' };

  if (!input.reason?.trim()) return { ok: false, error: 'Dispute reason is required' };
  if (!input.description?.trim()) return { ok: false, error: 'Dispute description is required' };

  let isParticipant = false;

  if (input.targetType === 'booking') {
    const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
    const booking = bookings.find((b) => b.id === input.targetId);
    if (!booking) return { ok: false, error: 'Booking not found' };

    isParticipant = booking.renterId === session.userId || booking.ownerId === session.userId;
    if (!isParticipant) {
      return { ok: false, error: 'Not allowed: Only the renter or owner involved in this booking can open a dispute' };
    }

    // Transition booking to disputed
    const tRes = transitionBooking(booking.id, 'disputed');
    if (!tRes.ok) return { ok: false, error: tRes.error };
  } else if (input.targetType === 'event') {
    const { data: events } = readStorage(STORAGE_KEYS.EVENT_REQUESTS, []);
    const eventReq = events.find((e) => e.id === input.targetId);
    if (!eventReq) return { ok: false, error: 'Event request not found' };

    isParticipant = eventReq.renterId === session.userId || eventReq.ownerId === session.userId;
    if (!isParticipant) {
      return { ok: false, error: 'Not allowed: Only the renter or owner involved in this event can open a dispute' };
    }

    // Advance event to disputed
    const tRes = advanceEvent(eventReq.id, 'disputed');
    if (!tRes.ok) return { ok: false, error: tRes.error };
  } else {
    return { ok: false, error: 'Invalid dispute target type' };
  }

  const { data: disputes } = readStorage(STORAGE_KEYS.DISPUTES, []);

  const newDispute = {
    id: generateId(),
    targetType: input.targetType,
    targetId: input.targetId,
    openedBy: session.userId,
    reason: input.reason.trim(),
    description: input.description.trim(),
    status: 'open',
    resolutionNotes: null,
    resolvedBy: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  const updated = [newDispute, ...disputes];
  const res = writeStorage(STORAGE_KEYS.DISPUTES, updated);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: newDispute };
}

/**
 * Resolve an open dispute as platform administrator.
 * Guarded write: admin only!
 *
 * @param {string} disputeId
 * @param {string} resolutionNotes
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function resolveDispute(disputeId, resolutionNotes) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const isAdmin = session.roles?.includes('admin');
  if (!isAdmin) return { ok: false, error: 'Not allowed: Only platform administrators can resolve disputes' };

  if (!resolutionNotes?.trim()) return { ok: false, error: 'Resolution notes are required' };

  const { data: disputes } = readStorage(STORAGE_KEYS.DISPUTES, []);
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) return { ok: false, error: 'Dispute not found' };

  if (dispute.status !== 'open') {
    return { ok: false, error: 'Dispute is already resolved' };
  }

  // Transition target booking/event to resolved
  if (dispute.targetType === 'booking') {
    transitionBooking(dispute.targetId, 'resolved');
  } else if (dispute.targetType === 'event') {
    advanceEvent(dispute.targetId, 'resolved');
  }

  const resolvedDispute = {
    ...dispute,
    status: 'resolved',
    resolutionNotes: resolutionNotes.trim(),
    resolvedBy: session.userId,
    resolvedAt: new Date().toISOString(),
  };

  const updated = disputes.map((d) => (d.id === disputeId ? resolvedDispute : d));
  const res = writeStorage(STORAGE_KEYS.DISPUTES, updated);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: resolvedDispute };
}

/**
 * Get disputes visible to the current caller.
 * Renters and owners see their own disputes; Admins see all disputes.
 * @returns {Array<object>}
 */
export function getDisputesForCurrentUser() {
  const session = getCurrentSession();
  if (!session) return [];

  const { data: disputes } = readStorage(STORAGE_KEYS.DISPUTES, []);
  const isAdmin = session.roles?.includes('admin');
  if (isAdmin) return disputes;

  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
  const { data: events } = readStorage(STORAGE_KEYS.EVENT_REQUESTS, []);

  const myBookingIds = new Set(
    bookings.filter((b) => b.renterId === session.userId || b.ownerId === session.userId).map((b) => b.id)
  );
  const myEventIds = new Set(
    events.filter((e) => e.renterId === session.userId || e.ownerId === session.userId).map((e) => e.id)
  );

  return disputes.filter(
    (d) =>
      d.openedBy === session.userId ||
      (d.targetType === 'booking' && myBookingIds.has(d.targetId)) ||
      (d.targetType === 'event' && myEventIds.has(d.targetId))
  );
}
