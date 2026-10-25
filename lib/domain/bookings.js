import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { generateId } from '@/lib/ids';
import { getCurrentSession } from './auth';
import { calculateBookingPrice } from '@/lib/rules/pricing';
import {
  checkStudioAvailability,
  checkEquipmentAvailability,
} from '@/lib/rules/availability';
import { BOOKING_TRANSITIONS, assertTransition } from '@/lib/rules/transitions';

/**
 * Create a new booking from client checkout or request.
 * Guarded write following hard rules: checks session, role, availability, and pricing.
 *
 * @param {{
 *   providerId: string,
 *   ownerId: string,
 *   date: string,
 *   startTime: string,
 *   endTime: string,
 *   hours: number,
 *   items: Array<{
 *     listingId: string,
 *     type: 'studio' | 'equipment',
 *     qty: number,
 *     rateSnapshot: number,
 *     deposit?: number,
 *     title?: string
 *   }>,
 *   paymentStatus?: 'pending' | 'paid',
 *   initialStatus?: 'requested' | 'confirmed'
 * }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function createBooking(input) {
  // 1. Session check
  const session = getCurrentSession();
  if (!session) {
    return { ok: false, error: 'Not signed in' };
  }

  // 2. User status check (block suspended users)
  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === session.userId);
  if (!user) {
    return { ok: false, error: 'User account not found' };
  }
  if (user.status === 'suspended') {
    return { ok: false, error: 'This account has been suspended' };
  }

  // 3. Input validation
  const { providerId, ownerId, date, startTime, endTime, hours, items } = input || {};
  if (!providerId || !ownerId || !date || !startTime || !endTime || !hours || !items?.length) {
    return { ok: false, error: 'Missing required booking parameters' };
  }

  // 4. Availability checks for all items
  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.id === providerId);

  for (const item of items) {
    const listing = listings.find((l) => l.id === item.listingId);
    if (!listing) {
      return { ok: false, error: `Listing not found: ${item.listingId}` };
    }

    if (item.type === 'studio') {
      const avail = checkStudioAvailability({
        listing,
        provider,
        date,
        startTime,
        endTime,
        hours,
      });
      if (!avail.available) {
        return { ok: false, error: avail.reason || 'Time slot unavailable' };
      }
    } else if (item.type === 'equipment') {
      const avail = checkEquipmentAvailability({
        listing,
        date,
        startTime,
        endTime,
        requestedQty: item.qty,
      });
      if (!avail.available) {
        return { ok: false, error: avail.reason || 'Equipment stock unavailable' };
      }
    }
  }

  // 5. Calculate guaranteed pricing
  const pricing = calculateBookingPrice({
    items: items.map((i) => ({
      rateSnapshot: i.rateSnapshot,
      hours,
      qty: i.qty,
      deposit: i.deposit,
    })),
  });

  // 6. Build booking entity
  const bookingId = generateId();
  const now = new Date().toISOString();

  const newBooking = {
    id: bookingId,
    providerId,
    renterId: session.userId,
    ownerId,
    date,
    startTime,
    endTime,
    hours,
    items: items.map((i) => ({
      listingId: i.listingId,
      type: i.type,
      qty: i.qty,
      rateSnapshot: i.rateSnapshot,
      lineTotal: Math.round(i.rateSnapshot * hours * i.qty * 100) / 100,
      title: i.title || '',
    })),
    subtotal: pricing.subtotal,
    deposit: pricing.deposit,
    fee: pricing.fee,
    total: pricing.total,
    paymentStatus: input.paymentStatus || 'pending',
    status: input.initialStatus || 'requested',
    createdAt: now,
    updatedAt: now,
  };

  // 7. Write to storage
  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
  const updated = [newBooking, ...bookings];
  const writeResult = writeStorage(STORAGE_KEYS.BOOKINGS, updated);

  if (!writeResult.ok) {
    return { ok: false, error: writeResult.error };
  }

  // Clear checkout draft from sessionStorage
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEYS.CHECKOUT_DRAFT);
  }

  return { ok: true, data: newBooking };
}

/**
 * Cancel a booking under the 24-hour rule.
 * Free until 24 hours before start; later cancellations are refused.
 * Only the booking renter or owner can cancel/decline.
 *
 * @param {string} bookingId
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function cancelBooking(bookingId) {
  const session = getCurrentSession();
  if (!session) {
    return { ok: false, error: 'Not signed in' };
  }

  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return { ok: false, error: 'Booking not found' };
  }

  // Ownership check: must be renter or owner
  const isRenter = booking.renterId === session.userId;
  const isOwner = booking.ownerId === session.userId;
  const isAdmin = session.roles?.includes('admin');

  if (!isRenter && !isOwner && !isAdmin) {
    return { ok: false, error: 'Not yours' };
  }

  // State check
  const transitionCheck = assertTransition(BOOKING_TRANSITIONS, booking.status, 'cancelled');
  if (!transitionCheck.ok) {
    return { ok: false, error: transitionCheck.error };
  }

  // 24-hour cancellation rule for renters cancelling confirmed bookings
  if (isRenter && booking.status === 'confirmed') {
    try {
      const bookingDateTime = new Date(`${booking.date}T${booking.startTime}:00+03:00`);
      const now = new Date();
      const diffMs = bookingDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24) {
        return {
          ok: false,
          error: 'Cancellations within 24 hours of booking start are not permitted. Please contact the studio directly.',
        };
      }
    } catch {
      // Ignore date parsing fallback
    }
  }

  // Apply cancellation
  const updatedBooking = {
    ...booking,
    status: 'cancelled',
    paymentStatus: booking.paymentStatus === 'paid' ? 'refunded' : booking.paymentStatus,
    updatedAt: new Date().toISOString(),
  };

  const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
  writeStorage(STORAGE_KEYS.BOOKINGS, updatedBookings);

  return { ok: true, data: updatedBooking };
}

/**
 * Transition a booking to a new state (owner or admin).
 * @param {string} bookingId
 * @param {string} targetState
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function transitionBooking(bookingId, targetState) {
  const session = getCurrentSession();
  if (!session) {
    return { ok: false, error: 'Not signed in' };
  }

  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return { ok: false, error: 'Booking not found' };
  }

  // Ownership check
  const isOwner = booking.ownerId === session.userId;
  const isAdmin = session.roles?.includes('admin');
  const isRenter = booking.renterId === session.userId;

  if (['confirmed', 'declined', 'in_progress', 'completed'].includes(targetState) && !isOwner && !isAdmin) {
    return { ok: false, error: 'Not allowed: Only the provider owner can perform this action' };
  }
  if (targetState === 'cancelled' && !isRenter && !isOwner && !isAdmin) {
    return { ok: false, error: 'Not allowed: Only the renter or provider owner can cancel this booking' };
  }
  if (targetState === 'disputed' && !isRenter && !isOwner && !isAdmin) {
    return { ok: false, error: 'Not allowed: Only parties to this booking can open a dispute' };
  }
  if (targetState === 'resolved' && !isAdmin) {
    return { ok: false, error: 'Not allowed: Only administrators can resolve disputes' };
  }

  // Confirming re-checks conflicts (Rule 2.5)
  if (targetState === 'confirmed') {

    const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
    const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
    const provider = providers.find((p) => p.id === booking.providerId);

    for (const item of booking.items) {
      const listing = listings.find((l) => l.id === item.listingId);
      if (listing?.type === 'studio') {
        const check = checkStudioAvailability({
          listing,
          provider,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          hours: booking.hours,
          excludeBookingId: booking.id,
        });
        if (!check.available) {
          return {
            ok: false,
            error: `Cannot confirm: Studio time slot now conflicts with an existing booking`,
          };
        }
      }
    }
  }

  // Assert state machine transition
  const transitionCheck = assertTransition(BOOKING_TRANSITIONS, booking.status, targetState);
  if (!transitionCheck.ok) {
    return { ok: false, error: transitionCheck.error };
  }

  const updatedBooking = {
    ...booking,
    status: targetState,
    updatedAt: new Date().toISOString(),
  };

  const updated = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
  writeStorage(STORAGE_KEYS.BOOKINGS, updated);

  return { ok: true, data: updatedBooking };
}

/**
 * Get a booking by ID with ownership guard.
 * Only the renter, owner, or admin may access.
 * @param {string} bookingId
 * @returns {object|null}
 */
export function getBookingById(bookingId) {
  const session = getCurrentSession();
  if (!session) return null;

  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return null;

  const isRenter = booking.renterId === session.userId;
  const isOwner = booking.ownerId === session.userId;
  const isAdmin = session.roles?.includes('admin');

  if (!isRenter && !isOwner && !isAdmin) {
    return null; // Refuse access to unauthorized users
  }

  return booking;
}
