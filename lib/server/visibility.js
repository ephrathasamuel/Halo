import 'server-only';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { DEFAULT_COUNTRY, providerLocation } from '@/lib/geo';

/*
 * What each person may see. The server applies this to everything it sends a
 * browser (/api/halo/data), so the rules below are enforced, not just hidden
 * buttons:
 *
 *   everyone        approved providers and listings, their portfolios,
 *                   reviews, active announcements, and other people's
 *                   bookings only as anonymous busy slots (date, time, status,
 *                   quantities) so availability can be shown;
 *   a customer      also their own bookings, quote requests, purchases and
 *                   disputes, plus contact details of the providers involved;
 *   an owner        also their storefronts and listings in any status, and
 *                   the bookings, requests, purchases and disputes for them,
 *                   with the customers' contact details;
 *   regional admin  everything belonging to providers and customers in their
 *                   country;
 *   global admin    everything.
 *
 * Passwords and session details never leave the server.
 */

const PRIVATE_USER_FIELDS = ['passwordHash', 'envPasswordHash', 'sessionVersion'];

function withoutSecrets(user) {
  const copy = { ...user };
  for (const field of PRIVATE_USER_FIELDS) delete copy[field];
  return copy;
}

// What anyone may know about any account (names on reviews, storefronts...).
function publicProfile(user) {
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar || '',
    roles: user.roles,
    status: user.status,
    country: user.country || DEFAULT_COUNTRY,
  };
}

// Another person's booking, reduced to what availability needs.
function busySlot(booking) {
  return {
    id: booking.id,
    providerId: booking.providerId,
    status: booking.status,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    hours: booking.hours,
    items: (booking.items || []).map((item) => ({ listingId: item.listingId, qty: item.qty })),
  };
}

/**
 * @param {object|null} session  Halo session (from the signed cookie)
 * @param {Record<string, any[]>} data  every collection, as stored
 * @returns {Record<string, any[]>} what this person may see
 */
export function visibleData(session, data) {
  const me = session?.userId || null;
  const roles = session?.roles || [];
  const isGlobal = roles.includes('admin');
  const isRegional = roles.includes('regional_admin');
  const myCountry = session?.adminScope?.country || null;

  const providers = data[STORAGE_KEYS.PROVIDERS] || [];
  const users = data[STORAGE_KEYS.USERS] || [];
  const providerById = new Map(providers.map((p) => [p.id, p]));
  const countryOf = (providerId) => {
    const provider = providerById.get(providerId);
    return provider ? providerLocation(provider).country : null;
  };
  const inScope = (providerId) => isGlobal || (isRegional && Boolean(myCountry) && countryOf(providerId) === myCountry);
  const ownsProvider = (providerId) => Boolean(me) && providerById.get(providerId)?.ownerId === me;
  const involved = (record) => Boolean(me) && (record.renterId === me || record.ownerId === me || record.buyerId === me);

  const userById = new Map(users.map((u) => [u.id, u]));
  const ownerActive = (provider) => (userById.get(provider.ownerId)?.status || 'active') === 'active';
  const publicProvider = (provider) => provider.status === 'approved' && ownerActive(provider);
  const providerVisible = (provider) => publicProvider(provider) || provider.ownerId === me || inScope(provider.id);

  const out = {};

  out[STORAGE_KEYS.PROVIDERS] = providers.filter(providerVisible);
  const visibleProviderIds = new Set(out[STORAGE_KEYS.PROVIDERS].map((p) => p.id));

  out[STORAGE_KEYS.LISTINGS] = (data[STORAGE_KEYS.LISTINGS] || []).filter(
    (listing) =>
      (listing.status === 'approved' && publicProvider(providerById.get(listing.providerId) || {})) ||
      listing.ownerId === me ||
      ownsProvider(listing.providerId) ||
      inScope(listing.providerId)
  );

  out[STORAGE_KEYS.PORTFOLIO] = (data[STORAGE_KEYS.PORTFOLIO] || []).filter((item) => visibleProviderIds.has(item.providerId));

  // People this person deals with: their contact details are visible.
  const counterparts = new Set();
  const noteParties = (record) => {
    for (const key of ['renterId', 'ownerId', 'buyerId', 'openedBy']) if (record[key]) counterparts.add(record[key]);
  };

  out[STORAGE_KEYS.BOOKINGS] = (data[STORAGE_KEYS.BOOKINGS] || []).map((booking) => {
    if (involved(booking) || ownsProvider(booking.providerId) || inScope(booking.providerId)) {
      noteParties(booking);
      return booking;
    }
    return busySlot(booking);
  });
  const fullBookingIds = new Set(out[STORAGE_KEYS.BOOKINGS].filter((b) => 'renterId' in b).map((b) => b.id));

  out[STORAGE_KEYS.EVENT_REQUESTS] = (data[STORAGE_KEYS.EVENT_REQUESTS] || []).filter((request) => {
    const ok = involved(request) || ownsProvider(request.providerId) || inScope(request.providerId);
    if (ok) noteParties(request);
    return ok;
  });
  const visibleRequestIds = new Set(out[STORAGE_KEYS.EVENT_REQUESTS].map((r) => r.id));

  out[STORAGE_KEYS.QUOTES] = (data[STORAGE_KEYS.QUOTES] || []).filter((quote) => visibleRequestIds.has(quote.requestId));

  out[STORAGE_KEYS.PURCHASES] = (data[STORAGE_KEYS.PURCHASES] || []).filter((purchase) => {
    const ok = involved(purchase) || ownsProvider(purchase.providerId) || inScope(purchase.providerId);
    if (ok) noteParties(purchase);
    return ok;
  });

  out[STORAGE_KEYS.DISPUTES] = (data[STORAGE_KEYS.DISPUTES] || []).filter((dispute) => {
    const ok =
      (me && dispute.openedBy === me) ||
      ownsProvider(dispute.providerId) ||
      inScope(dispute.providerId) ||
      fullBookingIds.has(dispute.targetId) ||
      visibleRequestIds.has(dispute.targetId);
    if (ok) noteParties(dispute);
    return ok;
  });

  out[STORAGE_KEYS.REVIEWS] = data[STORAGE_KEYS.REVIEWS] || [];

  const announcements = data[STORAGE_KEYS.ANNOUNCEMENTS] || [];
  out[STORAGE_KEYS.ANNOUNCEMENTS] = isGlobal || isRegional ? announcements : announcements.filter((a) => a.active);

  out[STORAGE_KEYS.USERS] = users.map((user) => {
    const full =
      user.id === me ||
      isGlobal ||
      (isRegional && (user.country || DEFAULT_COUNTRY) === myCountry) ||
      counterparts.has(user.id);
    return full ? withoutSecrets(user) : publicProfile(user);
  });

  return out;
}
