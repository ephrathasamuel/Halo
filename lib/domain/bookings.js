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
import { adminCountry, canAdminProvider, countryOfProvider, isAdminRole } from './adminScope';
import { currencyFor } from '@/lib/geo';

/**
 * Check every requested item is free at that time (studio overlap and cleanup
 * buffer, equipment stock). Shared by renter bookings and owner-recorded ones.
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function checkItemsAvailable({ providerId, date, startTime, endTime, hours, items }) {
  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.id === providerId);

  for (const item of items) {
    const listing = listings.find((l) => l.id === item.listingId);
    if (!listing) {
      return { ok: false, error: `Listing not found: ${item.listingId}` };
    }
    if (item.type === 'studio') {
      const avail = checkStudioAvailability({ listing, provider, date, startTime, endTime, hours });
      if (!avail.available) return { ok: false, error: avail.reason || 'Time slot unavailable' };
    } else if (item.type === 'equipment') {
      const avail = checkEquipmentAvailability({ listing, date, startTime, endTime, requestedQty: item.qty });
      if (!avail.available) return { ok: false, error: avail.reason || 'Equipment stock unavailable' };
    }
  }
  return { ok: true };
}

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
  const { providerId, date, startTime, endTime, hours, items: requestedItems } = input || {};
  if (!providerId || !date || !startTime || !endTime || !hours || !requestedItems?.length) {
    return { ok: false, error: 'Missing required booking parameters' };
  }
  if (!Number.isFinite(Number(hours)) || Number(hours) <= 0 || Number(hours) > 24) {
    return { ok: false, error: 'Choose how many hours you need' };
  }

  // Prices, deposits and the owner come from the stored provider and listings,
  // never from what the browser sent, so a booking can't be made at a made-up price.
  const { data: allProviders } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const provider = allProviders.find((p) => p.id === providerId);
  if (!provider || provider.status !== 'approved') return { ok: false, error: 'This provider is not taking bookings' };
  const ownerId = provider.ownerId;
  if (ownerId === session.userId) return { ok: false, error: "You can't book your own listing" };
  const { data: allListings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  const items = [];
  for (const requested of requestedItems) {
    const listing = allListings.find((l) => l.id === requested?.listingId);
    if (!listing || listing.providerId !== providerId || listing.status !== 'approved') {
      return { ok: false, error: 'One of the items is no longer available' };
    }
    if (listing.type !== 'studio' && listing.type !== 'equipment') {
      return { ok: false, error: 'This item cannot be booked by the hour' };
    }
    const qty = listing.type === 'studio' ? 1 : Math.floor(Number(requested.qty));
    if (!Number.isFinite(qty) || qty < 1) return { ok: false, error: 'Choose a quantity of at least 1' };
    items.push({
      listingId: listing.id,
      type: listing.type,
      qty,
      rateSnapshot: Number(listing.hourlyRate) || 0,
      deposit: listing.type === 'equipment' ? Number(listing.deposit) || 0 : 0,
      title: listing.title || '',
    });
  }

  // 4. Availability checks for all items
  const availability = checkItemsAvailable({ providerId, date, startTime, endTime, hours, items });
  if (!availability.ok) return availability;

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
    // Set here from the provider's country, never taken from the browser
    currency: currencyFor(countryOfProvider(providerId)),
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
  const isAdmin = canAdminProvider(session, booking.providerId);

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
  const isAdmin = canAdminProvider(session, booking.providerId);
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
  const isAdmin = canAdminProvider(session, booking.providerId);

  if (!isRenter && !isOwner && !isAdmin) {
    return null; // Refuse access to unauthorized users
  }

  return booking;
}

/**
 * Get all bookings belonging to the currently signed-in customer.
 * Guarded read: returns only bookings where renterId matches session.
 * @returns {Array<object>}
 */
export function getCustomerBookings() {
  const session = getCurrentSession();
  if (!session) return [];

  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
  return bookings.filter((b) => b.renterId === session.userId);
}

/**
 * Get all bookings belonging to the currently signed-in provider owner.
 * Guarded read: returns only bookings where ownerId matches session (or all for admin).
 * @returns {Array<object>}
 */
export function getOwnerBookings() {
  const session = getCurrentSession();
  if (!session) return [];

  const isOwner = session.roles?.includes('owner');
  const isAdmin = isAdminRole(session);
  if (!isOwner && !isAdmin) return [];

  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
  if (isAdmin) {
    const country = adminCountry(session);
    return country ? bookings.filter((b) => countryOfProvider(b.providerId) === country) : bookings;
  }
  return bookings.filter((b) => b.ownerId === session.userId);
}

/**
 * A booking the provider records themselves: a walk-in, a phone call, a client
 * who booked outside Halo. It blocks the slot (or stock) exactly like an online
 * booking and goes straight to "confirmed". The customer may not have a Halo
 * account, so their name and phone are stored on the booking.
 * @param {{
 *   listingId: string, date: string, startTime: string, hours: number, qty?: number,
 *   customerName: string, customerPhone?: string, note?: string, paid?: boolean
 * }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function createOwnerBooking(input) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  const listing = listings.find((l) => l.id === input?.listingId);
  if (!listing) return { ok: false, error: 'Choose one of your listings' };
  if (listing.ownerId !== session.userId && !canAdminProvider(session, listing.providerId)) {
    return { ok: false, error: 'Not yours: You can only record bookings for your own listings' };
  }
  if (!['studio', 'equipment'].includes(listing.type)) {
    return { ok: false, error: 'Only spaces and equipment are booked by the hour' };
  }

  const hours = Number(input.hours);
  const qty = listing.type === 'equipment' ? Math.max(1, Number(input.qty) || 1) : 1;
  if (!input.date || !input.startTime) return { ok: false, error: 'Choose a date and start time' };
  if (!hours || hours < 1) return { ok: false, error: 'Hours must be at least 1' };
  if (!input.customerName?.trim()) return { ok: false, error: "Add the customer's name" };

  const [h, m] = input.startTime.split(':').map(Number);
  const endMinutes = h * 60 + m + hours * 60;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

  const items = [
    {
      listingId: listing.id,
      type: listing.type,
      qty,
      rateSnapshot: listing.hourlyRate,
      deposit: listing.type === 'equipment' ? listing.deposit || 0 : 0,
      title: listing.title,
    },
  ];
  const availability = checkItemsAvailable({ providerId: listing.providerId, date: input.date, startTime: input.startTime, endTime, hours, items });
  if (!availability.ok) return availability;

  const pricing = calculateBookingPrice({ items: items.map((i) => ({ ...i, hours })) });
  const now = new Date().toISOString();
  const booking = {
    id: generateId(),
    providerId: listing.providerId,
    renterId: null,
    ownerId: listing.ownerId,
    source: 'owner',
    guest: { name: input.customerName.trim(), phone: input.customerPhone?.trim() || '' },
    note: input.note?.trim() || '',
    date: input.date,
    startTime: input.startTime,
    endTime,
    hours,
    items: items.map((i) => ({
      listingId: i.listingId,
      type: i.type,
      qty: i.qty,
      rateSnapshot: i.rateSnapshot,
      lineTotal: Math.round(i.rateSnapshot * hours * i.qty * 100) / 100,
      title: i.title,
    })),
    subtotal: pricing.subtotal,
    deposit: pricing.deposit,
    fee: pricing.fee,
    total: pricing.total,
    currency: currencyFor(countryOfProvider(listing.providerId)),
    paymentStatus: input.paid ? 'paid' : 'pending',
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  };

  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
  const res = writeStorage(STORAGE_KEYS.BOOKINGS, [booking, ...bookings]);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: booking };
}
