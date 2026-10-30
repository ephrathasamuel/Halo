import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { generateId } from '@/lib/ids';
import { getCurrentSession } from './auth';
import { canAdminProvider, countryOfProvider } from './adminScope';
import { currencyFor } from '@/lib/geo';
import { bookingsPausedReason } from './settings';

/*
 * Items for sale. A buyer sends a purchase request; the seller accepts or
 * declines it, then marks it sold once the handover and payment happened.
 * Selling reduces the listing's quantity, and a listing with nothing left is
 * hidden (status "sold").
 *
 *   requested -> accepted -> completed
 *             -> declined
 *             -> cancelled (by the buyer, before completion)
 */

const TRANSITIONS = {
  requested: ['accepted', 'declined', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: [],
};

/**
 * Ask to buy an item.
 * @param {{ listingId: string, quantity?: number, message?: string, phone?: string }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function createPurchaseRequest(input) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };
  const paused = bookingsPausedReason();
  if (paused) return { ok: false, error: paused };

  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  const listing = listings.find((l) => l.id === input?.listingId);
  if (!listing || listing.type !== 'sale' || listing.status !== 'approved') {
    return { ok: false, error: 'This item is no longer for sale' };
  }
  if (listing.ownerId === session.userId) return { ok: false, error: "You can't buy your own item" };

  const quantity = Math.max(1, Number(input.quantity) || 1);
  if (quantity > (listing.quantity || 1)) {
    return { ok: false, error: `Only ${listing.quantity} available` };
  }

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const buyer = users.find((u) => u.id === session.userId);
  if (buyer?.status === 'suspended') return { ok: false, error: 'This account has been suspended' };

  const now = new Date().toISOString();
  const request = {
    id: generateId(),
    listingId: listing.id,
    providerId: listing.providerId,
    ownerId: listing.ownerId,
    buyerId: session.userId,
    buyerName: buyer?.name || session.name,
    buyerPhone: input.phone?.trim() || buyer?.phone || '',
    title: listing.title,
    quantity,
    unitPrice: listing.salePrice,
    total: listing.salePrice * quantity,
    currency: currencyFor(countryOfProvider(listing.providerId)),
    message: input.message?.trim() || '',
    status: 'requested',
    createdAt: now,
    updatedAt: now,
  };

  const { data: purchases } = readStorage(STORAGE_KEYS.PURCHASES, []);
  const res = writeStorage(STORAGE_KEYS.PURCHASES, [request, ...purchases]);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: request };
}

/**
 * Move a purchase request along. The seller (or their country's admin) accepts,
 * declines or completes; the buyer can cancel. Completing reduces stock.
 * @param {string} requestId
 * @param {'accepted' | 'declined' | 'completed' | 'cancelled'} target
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function updatePurchaseRequest(requestId, target) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const { data: purchases } = readStorage(STORAGE_KEYS.PURCHASES, []);
  const request = purchases.find((p) => p.id === requestId);
  if (!request) return { ok: false, error: 'Request not found' };

  const isSeller = request.ownerId === session.userId || canAdminProvider(session, request.providerId);
  const isBuyer = request.buyerId === session.userId;
  if (target === 'cancelled' ? !isBuyer && !isSeller : !isSeller) {
    return { ok: false, error: 'Not allowed' };
  }
  if (!TRANSITIONS[request.status]?.includes(target)) {
    return { ok: false, error: `Can't change a ${request.status} request to ${target}` };
  }

  if (target === 'completed') {
    const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
    const listing = listings.find((l) => l.id === request.listingId);
    if (listing) {
      const left = Math.max(0, (listing.quantity || 1) - request.quantity);
      const updatedListing = { ...listing, quantity: left, status: left === 0 ? 'sold' : listing.status, updatedAt: new Date().toISOString() };
      writeStorage(STORAGE_KEYS.LISTINGS, listings.map((l) => (l.id === listing.id ? updatedListing : l)));
    }
  }

  const updated = { ...request, status: target, updatedAt: new Date().toISOString() };
  const res = writeStorage(STORAGE_KEYS.PURCHASES, purchases.map((p) => (p.id === requestId ? updated : p)));
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: updated };
}

/** Purchase requests for the signed-in seller's items. */
export function getSellerPurchaseRequests() {
  const session = getCurrentSession();
  if (!session) return [];
  const { data: purchases } = readStorage(STORAGE_KEYS.PURCHASES, []);
  return purchases.filter((p) => p.ownerId === session.userId);
}

/** Purchase requests the signed-in person sent. */
export function getMyPurchaseRequests() {
  const session = getCurrentSession();
  if (!session) return [];
  const { data: purchases } = readStorage(STORAGE_KEYS.PURCHASES, []);
  return purchases.filter((p) => p.buyerId === session.userId);
}
