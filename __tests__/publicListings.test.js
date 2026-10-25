import { describe, it, expect, beforeEach } from 'vitest';
import { getPublicListings, getListingById } from '@/lib/domain/listings';
import { getPublicProviders, getProviderBySlug } from '@/lib/domain/providers';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import {
  seedUsers,
  seedProviders,
  seedListings,
  seedBookings,
  LISTING_IDS,
  PROVIDER_IDS,
} from '@/lib/storage/seed';

describe('Public Visibility Rules (Rule 2.5)', () => {
  beforeEach(() => {
    localStorage.clear();
    writeStorage(STORAGE_KEYS.USERS, seedUsers);
    writeStorage(STORAGE_KEYS.PROVIDERS, seedProviders);
    writeStorage(STORAGE_KEYS.LISTINGS, seedListings);
    writeStorage(STORAGE_KEYS.BOOKINGS, seedBookings);
  });

  it('never returns pending provider listings (Pixel Nest)', () => {
    const { items } = getPublicListings({ pageSize: 100 });
    const pixelListings = items.filter((l) => l.providerId === PROVIDER_IDS.pixelNest);
    expect(pixelListings.length).toBe(0);
  });

  it('never returns rejected listings', () => {
    const { items } = getPublicListings({ pageSize: 100 });
    const rejected = items.filter((l) => l.id === LISTING_IDS.pixelRejected);
    expect(rejected.length).toBe(0);
  });

  it('never returns inactive listings (Gear Garage vintage set)', () => {
    const { items } = getPublicListings({ pageSize: 100 });
    const inactive = items.filter((l) => l.id === LISTING_IDS.gearInactiveSet);
    expect(inactive.length).toBe(0);
  });

  it('returns only approved public providers', () => {
    const providers = getPublicProviders();
    const slugs = providers.map((p) => p.slug);
    expect(slugs).toContain('b-light');
    expect(slugs).toContain('merkato-frames');
    expect(slugs).toContain('kazanchis-sound-house');
    expect(slugs).toContain('gear-garage');
    expect(slugs).toContain('habesha-cine-crew');
    expect(slugs).not.toContain('pixel-nest'); // pixel-nest is pending
  });

  it('returns null for getListingById on unapproved or pending listings', () => {
    expect(getListingById(LISTING_IDS.pixelRejected)).toBeNull();
    expect(getListingById(LISTING_IDS.pixelStudioRoom)).toBeNull();
    expect(getListingById(LISTING_IDS.gearInactiveSet)).toBeNull();
  });

  it('returns full listing with provider for valid public listing', () => {
    const listing = getListingById(LISTING_IDS.bLightMainStudio);
    expect(listing).not.toBeNull();
    expect(listing.title).toBe('Main Studio');
    expect(listing.provider.name).toBe('B Light');
  });
});

describe('Search, Filters, Sort, and Pagination', () => {
  beforeEach(() => {
    localStorage.clear();
    writeStorage(STORAGE_KEYS.USERS, seedUsers);
    writeStorage(STORAGE_KEYS.PROVIDERS, seedProviders);
    writeStorage(STORAGE_KEYS.LISTINGS, seedListings);
    writeStorage(STORAGE_KEYS.BOOKINGS, seedBookings);
  });

  it('searches case-insensitively by title and description', () => {
    const { items } = getPublicListings({ query: 'cyclorama' });
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((i) => i.title === 'Main Studio')).toBe(true);

    const uppercase = getPublicListings({ query: 'CYCLORAMA' });
    expect(uppercase.items.length).toBe(items.length);
  });

  it('filters by listing type', () => {
    const studios = getPublicListings({ type: 'studio', pageSize: 50 });
    expect(studios.items.every((i) => i.type === 'studio')).toBe(true);

    const equipment = getPublicListings({ type: 'equipment', pageSize: 50 });
    expect(equipment.items.every((i) => i.type === 'equipment')).toBe(true);
  });

  it('filters by neighbourhood', () => {
    const bole = getPublicListings({ neighbourhood: 'Bole', pageSize: 50 });
    expect(bole.items.every((i) => i._provider.neighbourhood === 'Bole')).toBe(true);
  });

  it('sorts by price ascending and descending', () => {
    const asc = getPublicListings({ sort: 'price_asc', pageSize: 50 });
    for (let i = 0; i < asc.items.length - 1; i++) {
      const priceA = asc.items[i].type === 'service' ? asc.items[i].startingFromHint : asc.items[i].hourlyRate;
      const priceB = asc.items[i + 1].type === 'service' ? asc.items[i + 1].startingFromHint : asc.items[i + 1].hourlyRate;
      expect(priceA).toBeLessThanOrEqual(priceB);
    }

    const desc = getPublicListings({ sort: 'price_desc', pageSize: 50 });
    for (let i = 0; i < desc.items.length - 1; i++) {
      const priceA = desc.items[i].type === 'service' ? desc.items[i].startingFromHint : desc.items[i].hourlyRate;
      const priceB = desc.items[i + 1].type === 'service' ? desc.items[i + 1].startingFromHint : desc.items[i + 1].hourlyRate;
      expect(priceA).toBeGreaterThanOrEqual(priceB);
    }
  });

  it('clamps pagination within bounds and returns correct pages', () => {
    const page1 = getPublicListings({ pageSize: 3, page: 1 });
    expect(page1.items.length).toBe(3);
    expect(page1.page).toBe(1);
    expect(page1.totalPages).toBeGreaterThan(1);

    // Negative page should clamp to 1
    const clampedUnder = getPublicListings({ pageSize: 3, page: -5 });
    expect(clampedUnder.page).toBe(1);

    // High page should clamp to totalPages
    const clampedOver = getPublicListings({ pageSize: 3, page: 999 });
    expect(clampedOver.page).toBe(clampedOver.totalPages);
  });
});
