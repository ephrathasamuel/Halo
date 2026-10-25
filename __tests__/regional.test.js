import { describe, it, expect, beforeEach } from 'vitest';
import { initializeDemoData, mergeSeed } from '@/lib/storage/initializeDemoData';
import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { signInAsDemo, signUpProvider } from '@/lib/domain/auth';
import { moderateProvider } from '@/lib/domain/providers';
import { moderateListing } from '@/lib/domain/listings';
import { createBooking } from '@/lib/domain/bookings';
import { createRegionalAdmin, getUsersList, suspendUser } from '@/lib/domain/users';
import { USER_IDS, PROVIDER_IDS, LISTING_IDS } from '@/lib/storage/seed';

describe('Countries and regional admins', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    initializeDemoData();
  });

  it('a regional admin can moderate providers in their own country', () => {
    signInAsDemo(USER_IDS.regionalEt);
    // Pixel Nest is a pending provider in Ethiopia
    const result = moderateProvider(PROVIDER_IDS.pixelNest, 'approved');
    expect(result.ok).toBe(true);
    expect(result.data.status).toBe('approved');
  });

  it('a regional admin cannot moderate providers or listings in another country', () => {
    signInAsDemo(USER_IDS.regionalKe);
    const provider = moderateProvider(PROVIDER_IDS.pixelNest, 'approved');
    expect(provider.ok).toBe(false);
    expect(provider.error).toContain('outside your region');

    const listing = moderateListing(LISTING_IDS.bLightMainStudio, 'inactive');
    expect(listing.ok).toBe(false);
    expect(listing.error).toContain('outside your region');
  });

  it('a regional admin only sees users from their own country', () => {
    signInAsDemo(USER_IDS.regionalKe);
    const users = getUsersList();
    expect(users.length).toBeGreaterThan(0);
    expect(users.every((u) => u.country === 'KE')).toBe(true);
  });

  it('a regional admin cannot suspend customers in another country, or other admins', () => {
    signInAsDemo(USER_IDS.regionalKe);
    expect(suspendUser(USER_IDS.renter1).ok).toBe(false);

    signInAsDemo(USER_IDS.regionalEt);
    expect(suspendUser(USER_IDS.renter1).ok).toBe(true);
    expect(suspendUser(USER_IDS.regionalKe).ok).toBe(false);
  });

  it('only a global admin can create regional admins', () => {
    signInAsDemo(USER_IDS.regionalEt);
    const denied = createRegionalAdmin({ name: 'New Admin', email: 'new@halo.demo', country: 'NG' });
    expect(denied.ok).toBe(false);

    signInAsDemo(USER_IDS.admin);
    const created = createRegionalAdmin({ name: 'New Admin', email: 'new@halo.demo', country: 'NG' });
    expect(created.ok).toBe(true);
    expect(created.data.roles).toEqual(['regional_admin']);
    expect(created.data.adminScope).toEqual({ country: 'NG' });
  });

  it('bookings take their currency from the provider country, not the browser', () => {
    signInAsDemo(USER_IDS.renterKe);
    const result = createBooking({
      providerId: PROVIDER_IDS.nairobiLightWorks,
      ownerId: USER_IDS.wanjiruKamau,
      date: '2026-12-10',
      startTime: '10:00',
      endTime: '12:00',
      hours: 2,
      currency: 'USD',
      items: [{ listingId: LISTING_IDS.nairobiStudio, type: 'studio', qty: 1, rateSnapshot: 4500 }],
    });
    expect(result.ok).toBe(true);
    expect(result.data.currency).toBe('KES');
  });

  it('a provider from another country can sign up and waits for approval', () => {
    const result = signUpProvider({
      name: 'Ada Obi',
      email: 'ada@lagosframes.demo',
      phone: '+2348000000000',
      businessName: 'Lagos Frames',
      country: 'NG',
      region: 'Lagos',
      city: 'Lagos',
      neighbourhood: 'Lekki',
    });
    expect(result.ok).toBe(true);
    const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
    const created = providers.find((p) => p.name === 'Lagos Frames');
    expect(created).toMatchObject({ country: 'NG', city: 'Lagos', status: 'pending', slug: 'lagos-frames' });
  });

  it('a city outside the chosen region is rejected at sign-up', () => {
    const result = signUpProvider({
      name: 'Ada Obi',
      email: 'ada2@lagosframes.demo',
      phone: '+2348000000001',
      businessName: 'Lagos Frames',
      country: 'NG',
      region: 'Lagos',
      city: 'Abuja',
      neighbourhood: 'Wuse',
    });
    expect(result.ok).toBe(false);
  });

  it('upgrading older saved data adds new records and fields without overwriting edits', () => {
    const stored = [{ id: 'a', name: 'Edited name' }];
    const seed = [
      { id: 'a', name: 'Seed name', country: 'ET' },
      { id: 'b', name: 'New record', country: 'KE' },
    ];
    const { merged, changed } = mergeSeed(stored, seed);
    expect(changed).toBe(true);
    expect(merged).toEqual([
      { id: 'a', name: 'Edited name', country: 'ET' },
      { id: 'b', name: 'New record', country: 'KE' },
    ]);
  });

  it('browsers holding pre-country data are upgraded on load', () => {
    // Simulate a browser that saved providers before countries existed
    const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
    const old = providers
      .filter((p) => p.id !== PROVIDER_IDS.nairobiLightWorks)
      .map(({ country, region, ...rest }) => rest); // eslint-disable-line no-unused-vars
    writeStorage(STORAGE_KEYS.PROVIDERS, old);
    localStorage.removeItem('halo_seed_version');

    initializeDemoData();
    const { data: upgraded } = readStorage(STORAGE_KEYS.PROVIDERS, []);
    expect(upgraded.find((p) => p.id === PROVIDER_IDS.bLight).country).toBe('ET');
    expect(upgraded.some((p) => p.id === PROVIDER_IDS.nairobiLightWorks)).toBe(true);
  });
});
