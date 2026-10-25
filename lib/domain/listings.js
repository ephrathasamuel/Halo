import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getPublicProviders } from './providers';
import { getCurrentSession } from './auth';
import { generateId } from '@/lib/ids';

/**
 * Filter and query public listings.
 * Enforces rule 2.5: only approved listings from approved providers with active owners.
 *
 * @param {object} [options]
 * @param {string} [options.query='']
 * @param {string} [options.type=''] - 'studio' | 'equipment' | 'service' | ''
 * @param {string} [options.neighbourhood='']
 * @param {number} [options.minPrice]
 * @param {number} [options.maxPrice]
 * @param {number} [options.capacity]
 * @param {number} [options.quantity]
 * @param {string} [options.date] - YYYY-MM-DD
 * @param {string} [options.sort='popularity'] - 'popularity' | 'price_asc' | 'price_desc' | 'newest'
 * @param {number} [options.page=1]
 * @param {number} [options.pageSize=6]
 * @returns {{
 *   items: Array<object>,
 *   total: number,
 *   totalPages: number,
 *   page: number,
 *   pageSize: number
 * }}
 */
export function getPublicListings(options = {}) {
  const {
    query = '',
    type = '',
    neighbourhood = '',
    minPrice,
    maxPrice,
    capacity,
    quantity,
    date,
    sort = 'popularity',
    page = 1,
    pageSize = 6,
  } = options;

  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
  const publicProviders = getPublicProviders();
  const providerMap = new Map(publicProviders.map((p) => [p.id, p]));

  // Step 1: Base eligibility filter
  let results = listings.filter((l) => {
    // Must be approved
    if (l.status !== 'approved') return false;
    // Must belong to an approved public provider
    const provider = providerMap.get(l.providerId);
    if (!provider) return false;
    // Attach provider data for downstream consumption
    l._provider = provider;
    return true;
  });

  // Step 2: Search query (case-insensitive across title, description, amenities, category, eventTypes)
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    results = results.filter((l) => {
      const titleMatch = l.title?.toLowerCase().includes(q);
      const descMatch = l.description?.toLowerCase().includes(q);
      const catMatch = l.category?.toLowerCase().includes(q);
      const amenitiesMatch = Array.isArray(l.amenities) && l.amenities.some((a) => a.toLowerCase().includes(q));
      const eventMatch = Array.isArray(l.eventTypes) && l.eventTypes.some((e) => e.toLowerCase().includes(q));
      const providerMatch = l._provider?.name?.toLowerCase().includes(q);
      const neighbourhoodMatch = l._provider?.neighbourhood?.toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch || amenitiesMatch || eventMatch || providerMatch || neighbourhoodMatch;
    });
  }

  // Step 3: Type filter
  if (type) {
    results = results.filter((l) => l.type === type);
  }

  // Step 4: Neighbourhood filter
  if (neighbourhood) {
    results = results.filter(
      (l) => l._provider?.neighbourhood?.toLowerCase() === neighbourhood.toLowerCase()
    );
  }

  // Step 5: Price range filter
  if (minPrice != null && !isNaN(minPrice)) {
    results = results.filter((l) => {
      const price = l.type === 'service' ? l.startingFromHint || 0 : l.hourlyRate || 0;
      return price >= Number(minPrice);
    });
  }
  if (maxPrice != null && !isNaN(maxPrice)) {
    results = results.filter((l) => {
      const price = l.type === 'service' ? l.startingFromHint || 0 : l.hourlyRate || 0;
      return price <= Number(maxPrice);
    });
  }

  // Step 6: Capacity / Quantity filters
  if (capacity != null && !isNaN(capacity) && Number(capacity) > 0) {
    results = results.filter((l) => {
      if (l.type === 'studio') {
        return (l.capacity || 0) >= Number(capacity);
      }
      return true;
    });
  }
  if (quantity != null && !isNaN(quantity) && Number(quantity) > 0) {
    results = results.filter((l) => {
      if (l.type === 'equipment') {
        return (l.quantity || 0) >= Number(quantity);
      }
      return true;
    });
  }

  // Step 7: Date availability filter
  if (date) {
    results = results.filter((l) => {
      // Check blocked dates for studios
      if (l.type === 'studio' && Array.isArray(l.blockedDates)) {
        if (l.blockedDates.includes(date)) return false;
      }
      // Check if event service is blocked for this day
      if (l.type === 'service') {
        const hasConfirmedEvent = bookings.some((b) => {
          return (
            b.date === date &&
            ['confirmed', 'in_progress'].includes(b.status) &&
            b.items?.some((i) => i.listingId === l.id)
          );
        });
        if (hasConfirmedEvent) return false;
      }
      return true;
    });
  }

  // Step 8: Popularity metric map (cached)
  const bookingCountByListing = new Map();
  bookings.forEach((b) => {
    if (['confirmed', 'in_progress', 'completed', 'reviewed'].includes(b.status)) {
      b.items?.forEach((i) => {
        const count = bookingCountByListing.get(i.listingId) || 0;
        bookingCountByListing.set(i.listingId, count + 1);
      });
    }
  });

  // Step 9: Sorting
  results.sort((a, b) => {
    if (sort === 'price_asc') {
      const priceA = a.type === 'service' ? a.startingFromHint || 0 : a.hourlyRate || 0;
      const priceB = b.type === 'service' ? b.startingFromHint || 0 : b.hourlyRate || 0;
      return priceA - priceB;
    }
    if (sort === 'price_desc') {
      const priceA = a.type === 'service' ? a.startingFromHint || 0 : a.hourlyRate || 0;
      const priceB = b.type === 'service' ? b.startingFromHint || 0 : b.hourlyRate || 0;
      return priceB - priceA;
    }
    if (sort === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    // Default: 'popularity'
    const popA = bookingCountByListing.get(a.id) || 0;
    const popB = bookingCountByListing.get(b.id) || 0;
    if (popB !== popA) return popB - popA;
    // Secondary tie-breaker: rating or newest
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Step 10: Pagination
  const total = results.length;
  const safePageSize = Math.max(1, Number(pageSize) || 6);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (safePage - 1) * safePageSize;
  const paginatedItems = results.slice(startIndex, startIndex + safePageSize);

  return {
    items: paginatedItems,
    total,
    totalPages,
    page: safePage,
    pageSize: safePageSize,
  };
}

/**
 * Get a single public listing by ID, including its provider.
 * Returns null if not public or not found.
 * @param {string} id
 * @returns {object|null}
 */
export function getListingById(id) {
  if (!id) return null;
  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  const listing = listings.find((l) => l.id === id);
  if (!listing) return null;

  // Verify public visibility
  if (listing.status !== 'approved') return null;

  const publicProviders = getPublicProviders();
  const provider = publicProviders.find((p) => p.id === listing.providerId);
  if (!provider) return null;

  return {
    ...listing,
    provider,
  };
}

/**
 * Get all listings for an owner's provider.
 * Guarded read: must be owner of provider or admin.
 * @param {string} providerId
 * @returns {Array<object>}
 */
export function getOwnerListings(providerId) {
  const session = getCurrentSession();
  if (!session) return [];

  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.id === providerId);
  if (!provider) return [];

  const isAdmin = session.roles?.includes('admin');
  if (provider.ownerId !== session.userId && !isAdmin) {
    return [];
  }

  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  return listings.filter((l) => l.providerId === providerId);
}

/**
 * Get a single listing for owner editing.
 * Guarded read: returns listing only if caller is owner or admin.
 * @param {string} listingId
 * @returns {object|null}
 */
export function getListingForOwner(listingId) {
  const session = getCurrentSession();
  if (!session) return null;

  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) return null;

  const isAdmin = session.roles?.includes('admin');
  if (listing.ownerId !== session.userId && !isAdmin) {
    return null;
  }

  return listing;
}

/**
 * Save or update a listing.
 * Guarded write: session -> role -> ownership -> type-specific validation.
 * @param {object} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function saveListing(input) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const isOwner = session.roles?.includes('owner');
  const isAdmin = session.roles?.includes('admin');
  if (!isOwner && !isAdmin) {
    return { ok: false, error: 'Not allowed: Requires owner role' };
  }

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === session.userId);
  if (user?.status === 'suspended') {
    return { ok: false, error: 'Account suspended' };
  }

  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.id === input.providerId);
  if (!provider) {
    return { ok: false, error: 'Provider not found' };
  }

  if (provider.ownerId !== session.userId && !isAdmin) {
    return { ok: false, error: 'Not yours: Cannot create or edit listing for another provider' };
  }

  // Common validation
  if (!input.title?.trim()) return { ok: false, error: 'Title is required' };
  if (!['studio', 'equipment', 'service'].includes(input.type)) {
    return { ok: false, error: 'Invalid listing type' };
  }

  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);

  let listingPayload = {
    providerId: provider.id,
    ownerId: provider.ownerId,
    type: input.type,
    title: input.title.trim(),
    description: input.description?.trim() || '',
    photos: Array.isArray(input.photos) && input.photos.length > 0 ? input.photos : ['/images/listings/b-light-studio-1.jpg'],
    status: input.status || 'approved',
  };

  // Type specific validation & payload
  if (input.type === 'studio') {
    const hourlyRate = Number(input.hourlyRate);
    const minHours = Number(input.minHours);
    const capacity = Number(input.capacity);
    const bufferMinutes = Number(input.bufferMinutes);

    if (isNaN(hourlyRate) || hourlyRate <= 0) return { ok: false, error: 'Hourly rate must be greater than 0' };
    if (isNaN(minHours) || minHours < 1) return { ok: false, error: 'Minimum hours must be at least 1' };
    if (isNaN(capacity) || capacity < 1) return { ok: false, error: 'Capacity must be at least 1 person' };

    listingPayload = {
      ...listingPayload,
      hourlyRate,
      minHours,
      capacity,
      bufferMinutes: isNaN(bufferMinutes) ? 30 : bufferMinutes,
      amenities: Array.isArray(input.amenities) ? input.amenities : [],
      blockedDates: Array.isArray(input.blockedDates) ? input.blockedDates : [],
    };
  } else if (input.type === 'equipment') {
    const hourlyRate = Number(input.hourlyRate);
    const deposit = Number(input.deposit);
    const quantity = Number(input.quantity);

    if (!input.category?.trim()) return { ok: false, error: 'Category is required (e.g. Camera, Lighting, Audio)' };
    if (isNaN(hourlyRate) || hourlyRate <= 0) return { ok: false, error: 'Hourly rate must be greater than 0' };
    if (isNaN(deposit) || deposit < 0) return { ok: false, error: 'Deposit cannot be negative' };
    if (isNaN(quantity) || quantity < 1) return { ok: false, error: 'Quantity must be at least 1' };

    listingPayload = {
      ...listingPayload,
      category: input.category.trim(),
      hourlyRate,
      deposit,
      quantity,
      condition: input.condition || 'Excellent',
    };
  } else if (input.type === 'service') {
    const startingFromHint = Number(input.startingFromHint);
    if (!Array.isArray(input.eventTypes) || input.eventTypes.length === 0) {
      return { ok: false, error: 'At least one event type is required' };
    }
    if (isNaN(startingFromHint) || startingFromHint <= 0) {
      return { ok: false, error: 'Starting price hint must be greater than 0' };
    }

    listingPayload = {
      ...listingPayload,
      eventTypes: input.eventTypes,
      startingFromHint,
      pricingModel: 'quote',
    };
  }

  let savedListing;
  let updatedList;

  if (input.id) {
    const existing = listings.find((l) => l.id === input.id);
    if (!existing) return { ok: false, error: 'Listing not found' };
    if (existing.ownerId !== session.userId && !isAdmin) {
      return { ok: false, error: 'Not yours: Cannot edit another owner listing' };
    }

    savedListing = {
      ...existing,
      ...listingPayload,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    updatedList = listings.map((l) => (l.id === savedListing.id ? savedListing : l));
  } else {
    savedListing = {
      ...listingPayload,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    updatedList = [savedListing, ...listings];
  }

  const res = writeStorage(STORAGE_KEYS.LISTINGS, updatedList);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: savedListing };
}

/**
 * Toggle listing active / inactive.
 * Guarded write.
 * @param {string} listingId
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function deactivateListing(listingId) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, error: 'Listing not found' };

  const isAdmin = session.roles?.includes('admin');
  if (listing.ownerId !== session.userId && !isAdmin) {
    return { ok: false, error: 'Not yours: You cannot toggle this listing' };
  }

  const nextStatus = listing.status === 'approved' ? 'inactive' : 'approved';
  const updatedListing = { ...listing, status: nextStatus, updatedAt: new Date().toISOString() };
  const updatedList = listings.map((l) => (l.id === listingId ? updatedListing : l));

  const res = writeStorage(STORAGE_KEYS.LISTINGS, updatedList);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: updatedListing };
}

/**
 * Update studio listing availability (blocked dates and buffer minutes).
 * Guarded write.
 * @param {string} listingId
 * @param {{ blockedDates?: string[], bufferMinutes?: number }} availabilityData
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function updateListingAvailability(listingId, availabilityData = {}) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, error: 'Listing not found' };

  const isAdmin = session.roles?.includes('admin');
  if (listing.ownerId !== session.userId && !isAdmin) {
    return { ok: false, error: 'Not yours: Cannot edit availability for another owner listing' };
  }

  if (listing.type !== 'studio') {
    return { ok: false, error: 'Availability settings only apply to studio listings' };
  }

  const updatedListing = {
    ...listing,
    bufferMinutes: typeof availabilityData.bufferMinutes === 'number' ? availabilityData.bufferMinutes : listing.bufferMinutes,
    blockedDates: Array.isArray(availabilityData.blockedDates) ? availabilityData.blockedDates : (listing.blockedDates || []),
    updatedAt: new Date().toISOString(),
  };

  const updatedList = listings.map((l) => (l.id === listingId ? updatedListing : l));
  const res = writeStorage(STORAGE_KEYS.LISTINGS, updatedList);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: updatedListing };
}
