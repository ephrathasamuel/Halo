import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { initializeDemoData } from '@/lib/storage/initializeDemoData';
import { signInAsDemo, signOut } from '@/lib/domain/auth';
import {
  saveProvider,
  savePortfolioItem,
  deletePortfolioItem,
} from '@/lib/domain/providers';
import {
  saveListing,
  deactivateListing,
  updateListingAvailability,
} from '@/lib/domain/listings';
import {
  getCustomerBookings,
  getOwnerBookings,
  transitionBooking,
} from '@/lib/domain/bookings';
import { USER_IDS, PROVIDER_IDS, LISTING_IDS, BOOKING_IDS } from '@/lib/storage/seed';

describe('Phase 4: Customer and Owner Journeys', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    initializeDemoData();
  });

  describe('Customer Bookings & Data Boundaries', () => {
    it('getCustomerBookings returns only bookings belonging to the current renter', () => {
      // Sign in as renter 1 (Abebe)
      signInAsDemo(USER_IDS.renter1);

      const renter1Bookings = getCustomerBookings();
      expect(renter1Bookings.length).toBeGreaterThan(0);
      for (const b of renter1Bookings) {
        expect(b.renterId).toBe(USER_IDS.renter1);
      }

      // Switch to renter 2 (Sara)
      signOut();
      signInAsDemo(USER_IDS.renter2);
      const renter2Bookings = getCustomerBookings();
      expect(renter2Bookings.length).toBeGreaterThan(0);
      for (const b of renter2Bookings) {
        expect(b.renterId).toBe(USER_IDS.renter2);
      }
    });

    it('refuses customer bookings read when not signed in', () => {
      signOut();
      const bookings = getCustomerBookings();
      expect(bookings).toEqual([]);
    });
  });

  describe('Owner Provider & Portfolio Ownership Guards', () => {
    it('refuses provider edits by non-owner', () => {
      // Dawit owns Merkato Frames, attempts to edit B Light (owned by Meron)
      signInAsDemo(USER_IDS.dawitAlemu);

      const res = saveProvider({
        id: PROVIDER_IDS.bLight,
        name: 'Hacked B Light',
        tagline: 'Unauthorized change',
        neighbourhood: 'Bole',
        contact: { phone: '+251911999999' },
      });

      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/Not yours/i);

      // Verify B Light was not modified
      const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
      const bLight = providers.find((p) => p.id === PROVIDER_IDS.bLight);
      expect(bLight.name).toBe('B Light');
    });

    it('allows provider owner to update own storefront', () => {
      // Meron owns B Light
      signInAsDemo(USER_IDS.meronTadesse);

      const res = saveProvider({
        id: PROVIDER_IDS.bLight,
        name: 'B Light Studios Official',
        tagline: 'Addis Premier Filming Location',
        neighbourhood: 'Bole',
        contact: { phone: '+251911000002', whatsapp: '+251911000002' },
      });

      expect(res.ok).toBe(true);
      expect(res.data.name).toBe('B Light Studios Official');

      const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
      const bLight = providers.find((p) => p.id === PROVIDER_IDS.bLight);
      expect(bLight.name).toBe('B Light Studios Official');
      expect(bLight.tagline).toBe('Addis Premier Filming Location');
    });

    it('refuses portfolio creation for another provider', () => {
      signInAsDemo(USER_IDS.dawitAlemu);

      const res = savePortfolioItem({
        providerId: PROVIDER_IDS.bLight,
        title: 'Unauthorized Wedding Photos',
        eventType: 'Wedding',
      });

      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/Not yours/i);
    });

    it('allows owner to add and delete own portfolio item', () => {
      signInAsDemo(USER_IDS.meronTadesse);

      const addRes = savePortfolioItem({
        providerId: PROVIDER_IDS.bLight,
        title: 'New Commercial Showcase',
        eventType: 'Commercial',
        mediaUrl: '/images/portfolio/commercial.jpg',
      });

      expect(addRes.ok).toBe(true);
      expect(addRes.data.title).toBe('New Commercial Showcase');

      // Now delete it
      const deleteRes = deletePortfolioItem(addRes.data.id);
      expect(deleteRes.ok).toBe(true);

      const { data: portfolio } = readStorage(STORAGE_KEYS.PORTFOLIO, []);
      expect(portfolio.find((i) => i.id === addRes.data.id)).toBeUndefined();
    });
  });

  describe('Owner Listings Management & Availability Guards', () => {
    it('refuses listing creation by non-owner user', () => {
      // Abebe is a renter, has no owner role
      signInAsDemo(USER_IDS.renter1);

      const res = saveListing({
        providerId: PROVIDER_IDS.bLight,
        type: 'studio',
        title: 'Renter Rogue Studio',
        hourlyRate: 500,
        minHours: 2,
        capacity: 10,
      });

      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/Requires owner role/i);
    });

    it('refuses listing modification for listing owned by another provider', () => {
      // Dawit attempts to modify B Light Main Studio
      signInAsDemo(USER_IDS.dawitAlemu);

      const res = saveListing({
        id: LISTING_IDS.bLightMainStudio,
        providerId: PROVIDER_IDS.bLight,
        type: 'studio',
        title: 'Hijacked Studio',
        hourlyRate: 100,
        minHours: 1,
        capacity: 5,
      });

      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/Not yours/i);
    });

    it('allows owner to create a new studio listing with validation', () => {
      signInAsDemo(USER_IDS.meronTadesse);

      // Invalid hourly rate
      const invalidRes = saveListing({
        providerId: PROVIDER_IDS.bLight,
        type: 'studio',
        title: 'Studio B',
        hourlyRate: 0,
        minHours: 2,
        capacity: 10,
      });
      expect(invalidRes.ok).toBe(false);
      expect(invalidRes.error).toMatch(/Hourly rate must be greater than 0/i);

      // Valid studio
      const validRes = saveListing({
        providerId: PROVIDER_IDS.bLight,
        type: 'studio',
        title: 'Studio B (Daylight Room)',
        hourlyRate: 750,
        minHours: 2,
        capacity: 12,
        bufferMinutes: 30,
        amenities: ['Natural light', 'Wi-Fi'],
      });

      expect(validRes.ok).toBe(true);
      expect(validRes.data.hourlyRate).toBe(750);
      expect(validRes.data.bufferMinutes).toBe(30);

      // Verify stored
      const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
      expect(listings.find((l) => l.id === validRes.data.id)).toBeDefined();
    });

    it('toggles listing status between approved and inactive', () => {
      signInAsDemo(USER_IDS.meronTadesse);

      const toggle1 = deactivateListing(LISTING_IDS.bLightMainStudio);
      expect(toggle1.ok).toBe(true);
      expect(toggle1.data.status).toBe('inactive');

      const toggle2 = deactivateListing(LISTING_IDS.bLightMainStudio);
      expect(toggle2.ok).toBe(true);
      expect(toggle2.data.status).toBe('approved');
    });

    it('allows owner to manage studio buffer minutes and blackout dates', () => {
      signInAsDemo(USER_IDS.meronTadesse);

      const res = updateListingAvailability(LISTING_IDS.bLightMainStudio, {
        bufferMinutes: 45,
        blockedDates: ['2026-11-01', '2026-11-02'],
      });

      expect(res.ok).toBe(true);
      expect(res.data.bufferMinutes).toBe(45);
      expect(res.data.blockedDates).toEqual(['2026-11-01', '2026-11-02']);
    });
  });

  describe('Owner Bookings Pipeline & Transitions', () => {
    it('getOwnerBookings returns bookings for current owner', () => {
      signInAsDemo(USER_IDS.meronTadesse);
      const bookings = getOwnerBookings();
      expect(bookings.length).toBeGreaterThan(0);
      for (const b of bookings) {
        expect(b.ownerId).toBe(USER_IDS.meronTadesse);
      }
    });

    it('allows owner to confirm a requested booking', () => {
      signInAsDemo(USER_IDS.meronTadesse);

      const res = transitionBooking(BOOKING_IDS.requested, 'confirmed');
      expect(res.ok).toBe(true);
      expect(res.data.status).toBe('confirmed');
    });

    it('allows owner to advance confirmed booking to in_progress and then completed', () => {
      signInAsDemo(USER_IDS.meronTadesse);

      const step1 = transitionBooking(BOOKING_IDS.confirmed, 'in_progress');
      expect(step1.ok).toBe(true);
      expect(step1.data.status).toBe('in_progress');

      const step2 = transitionBooking(BOOKING_IDS.confirmed, 'completed');
      expect(step2.ok).toBe(true);
      expect(step2.data.status).toBe('completed');
    });

    it('refuses booking confirmation if another user tries to confirm', () => {
      // Dawit is not the owner of B Light bookings
      signInAsDemo(USER_IDS.dawitAlemu);

      const res = transitionBooking(BOOKING_IDS.requested, 'confirmed');
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/Only the provider owner can perform this action/i);
    });
  });
});
