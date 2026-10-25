import { describe, it, expect, beforeEach } from 'vitest';
import { initializeDemoData } from '@/lib/storage/initializeDemoData';
import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { signInAsDemo } from '@/lib/domain/auth';
import { saveListing, deactivateListing } from '@/lib/domain/listings';
import { createBooking, createOwnerBooking } from '@/lib/domain/bookings';
import { createPurchaseRequest, updatePurchaseRequest } from '@/lib/domain/sales';
import { updateProfile } from '@/lib/domain/users';
import { USER_IDS, PROVIDER_IDS, LISTING_IDS } from '@/lib/storage/seed';

const FUTURE_DATE = '2026-12-14';

describe('Provider tools: listings, own bookings, items for sale', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    initializeDemoData();
  });

  it('saves an item for sale with its own details and uploaded photos', () => {
    signInAsDemo(USER_IDS.yonasGirma);
    const res = saveListing({
      providerId: PROVIDER_IDS.gearGarage,
      type: 'sale',
      title: 'Carbon tripod',
      salePrice: 9000,
      quantity: 2,
      condition: 'Like new',
      negotiable: true,
      photos: ['data:image/jpeg;base64,AAA'],
      details: [
        { label: 'Brand', value: 'Manfrotto' },
        { label: 'Model', value: '' }, // empty rows are dropped
      ],
    });
    expect(res.ok).toBe(true);
    expect(res.data).toMatchObject({ type: 'sale', salePrice: 9000, quantity: 2, negotiable: true });
    expect(res.data.details).toEqual([{ label: 'Brand', value: 'Manfrotto' }]);
    expect(res.data.photos).toEqual(['data:image/jpeg;base64,AAA']);
  });

  it('does not add a stock photo when the provider uploads none', () => {
    signInAsDemo(USER_IDS.yonasGirma);
    const res = saveListing({ providerId: PROVIDER_IDS.gearGarage, type: 'sale', title: 'Light stand', salePrice: 1500 });
    expect(res.ok).toBe(true);
    expect(res.data.photos).toEqual([]);
  });

  it('cannot switch on a listing that is waiting for review', () => {
    signInAsDemo(USER_IDS.samuelKebede);
    const res = deactivateListing(LISTING_IDS.pixelStudioRoom);
    expect(res.ok).toBe(false);
    const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
    expect(listings.find((l) => l.id === LISTING_IDS.pixelStudioRoom).status).toBe('pending');
  });

  it('a booking the owner records blocks the same slot for renters', () => {
    signInAsDemo(USER_IDS.meronTadesse);
    const recorded = createOwnerBooking({
      listingId: LISTING_IDS.bLightMainStudio,
      date: FUTURE_DATE,
      startTime: '10:00',
      hours: 3,
      customerName: 'Walk-in client',
      customerPhone: '+251900000000',
      paid: true,
    });
    expect(recorded.ok).toBe(true);
    expect(recorded.data).toMatchObject({ status: 'confirmed', source: 'owner', paymentStatus: 'paid', renterId: null });
    expect(recorded.data.guest.name).toBe('Walk-in client');

    signInAsDemo(USER_IDS.renter1);
    const clash = createBooking({
      providerId: PROVIDER_IDS.bLight,
      ownerId: USER_IDS.meronTadesse,
      date: FUTURE_DATE,
      startTime: '11:00',
      endTime: '13:00',
      hours: 2,
      items: [{ listingId: LISTING_IDS.bLightMainStudio, type: 'studio', qty: 1, rateSnapshot: 600 }],
    });
    expect(clash.ok).toBe(false);
  });

  it('owners cannot record bookings on someone else\'s listing', () => {
    signInAsDemo(USER_IDS.dawitAlemu);
    const res = createOwnerBooking({
      listingId: LISTING_IDS.bLightMainStudio,
      date: FUTURE_DATE,
      startTime: '10:00',
      hours: 2,
      customerName: 'Someone',
    });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Not yours/);
  });

  it('runs a sale from request to sold, and hides the item when none are left', () => {
    signInAsDemo(USER_IDS.renter1);
    const request = createPurchaseRequest({ listingId: LISTING_IDS.gearSaleLens, message: 'Would you take 25,000?' });
    expect(request.ok).toBe(true);
    expect(request.data).toMatchObject({ status: 'requested', currency: 'ETB', total: 28000 });

    // The buyer cannot accept their own request
    expect(updatePurchaseRequest(request.data.id, 'accepted').ok).toBe(false);

    signInAsDemo(USER_IDS.yonasGirma);
    expect(updatePurchaseRequest(request.data.id, 'accepted').ok).toBe(true);
    expect(updatePurchaseRequest(request.data.id, 'completed').ok).toBe(true);

    const { data: listings } = readStorage(STORAGE_KEYS.LISTINGS, []);
    const lens = listings.find((l) => l.id === LISTING_IDS.gearSaleLens);
    expect(lens.quantity).toBe(0);
    expect(lens.status).toBe('sold');
  });

  it('a seller cannot buy their own item', () => {
    signInAsDemo(USER_IDS.yonasGirma);
    const res = createPurchaseRequest({ listingId: LISTING_IDS.gearSaleLens });
    expect(res.ok).toBe(false);
  });

  it('profile updates change name and photo but never roles', () => {
    signInAsDemo(USER_IDS.renter1);
    const res = updateProfile({ name: 'Abebe K.', avatar: 'data:image/jpeg;base64,BBB', roles: ['admin'] });
    expect(res.ok).toBe(true);
    expect(res.data.name).toBe('Abebe K.');
    expect(res.data.avatar).toBe('data:image/jpeg;base64,BBB');
    expect(res.data.roles).toEqual(['renter']);
  });
});
