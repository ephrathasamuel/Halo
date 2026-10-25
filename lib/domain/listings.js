import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getPublicProviders } from './providers';

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
