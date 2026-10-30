'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, CheckCircle2, Plus } from 'lucide-react';
import { formatMoney, formatPrice, formatTime } from '@/lib/format';
import { providerLocation } from '@/lib/geo';
import { calculateBookingPrice } from '@/lib/rules/pricing';
import {
  checkStudioAvailability,
  checkEquipmentAvailability,
  minutesToTime,
  timeToMinutes,
} from '@/lib/rules/availability';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { useSession } from '@/hooks/useSession';
import { useListings } from '@/hooks/useListings';
import { useStorageSync } from '@/hooks/useStorageSync';
import { bookingsPausedReason } from '@/lib/domain/settings';

/**
 * Interactive booking panel for studio and equipment listings.
 * @param {{
 *   listing: object,
 *   provider: object
 * }} props
 */
export function BookingPanel({ listing, provider }) {
  const router = useRouter();
  const { session, isSignedIn } = useSession();
  const { listings: allListings } = useListings({ publicOnly: true });
  useStorageSync(STORAGE_KEYS.SETTINGS, []); // re-render when an admin pauses bookings
  const paused = bookingsPausedReason();

  const isStudio = listing.type === 'studio';
  const { currency } = providerLocation(provider);
  const minHours = listing.minHours || 2;

  // Tomorrow's date as default
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [date, setDate] = useState(tomorrowStr);
  const [startTime, setStartTime] = useState('10:00');
  const [hours, setHours] = useState(minHours);
  const [equipmentQty, setEquipmentQty] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState({}); // listingId -> qty
  const [formError, setFormError] = useState('');

  // Equipment available from same provider as add-ons
  const availableEquipmentAddOns = useMemo(() => {
    if (!isStudio) return [];
    return allListings.filter(
      (l) => l.providerId === listing.providerId && l.type === 'equipment' && l.quantity > 0
    );
  }, [isStudio, allListings, listing.providerId]);

  // End time calculation
  const endTime = useMemo(() => {
    const startMins = timeToMinutes(startTime);
    const endMins = startMins + hours * 60;
    return minutesToTime(endMins);
  }, [startTime, hours]);

  // Live availability check
  const availability = useMemo(() => {
    if (!date || !startTime || !endTime) {
      return { available: false, reason: 'Please select a date and time' };
    }

    if (isStudio) {
      return checkStudioAvailability({
        listing,
        provider,
        date,
        startTime,
        endTime,
        hours,
      });
    } else {
      return checkEquipmentAvailability({
        listing,
        date,
        startTime,
        endTime,
        requestedQty: equipmentQty,
      });
    }
  }, [isStudio, listing, provider, date, startTime, endTime, hours, equipmentQty]);

  // Live pricing breakdown
  const pricing = useMemo(() => {
    const items = [];

    // Main item
    if (isStudio) {
      items.push({
        listingId: listing.id,
        type: 'studio',
        rateSnapshot: listing.hourlyRate,
        hours,
        qty: 1,
        deposit: 0,
        title: listing.title,
      });

      // Add-ons
      for (const [addonId, qty] of Object.entries(selectedAddOns)) {
        if (qty > 0) {
          const addonListing = availableEquipmentAddOns.find((a) => a.id === addonId);
          if (addonListing) {
            items.push({
              listingId: addonListing.id,
              type: 'equipment',
              rateSnapshot: addonListing.hourlyRate,
              hours,
              qty,
              deposit: addonListing.deposit || 0,
              title: addonListing.title,
            });
          }
        }
      }
    } else {
      items.push({
        listingId: listing.id,
        type: 'equipment',
        rateSnapshot: listing.hourlyRate,
        hours,
        qty: equipmentQty,
        deposit: listing.deposit || 0,
        title: listing.title,
      });
    }

    return {
      items,
      ...calculateBookingPrice({ items }),
    };
  }, [isStudio, listing, hours, equipmentQty, selectedAddOns, availableEquipmentAddOns]);

  const handleToggleAddOn = (addonId, maxQty) => {
    setSelectedAddOns((prev) => {
      const current = prev[addonId] || 0;
      if (current >= maxQty) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }
      return { ...prev, [addonId]: current + 1 };
    });
  };

  const handleProceedToCheckout = () => {
    setFormError('');

    if (!availability.available) {
      setFormError(availability.reason || 'Selected time is not available');
      return;
    }

    if (!isSignedIn) {
      router.push(`/signin?next=${encodeURIComponent(`/listings/${listing.id}`)}`);
      return;
    }

    if (session?.status === 'suspended') {
      setFormError('Your account has been suspended. You cannot make bookings.');
      return;
    }

    // Save draft to sessionStorage
    const draft = {
      providerId: listing.providerId,
      ownerId: listing.ownerId,
      providerName: provider?.name,
      providerNeighbourhood: provider?.neighbourhood,
      date,
      startTime,
      endTime,
      hours,
      items: pricing.items,
      subtotal: pricing.subtotal,
      fee: pricing.fee,
      deposit: pricing.deposit,
      total: pricing.total,
      currency,
      createdAt: new Date().toISOString(),
    };

    const draftResult = writeStorage(STORAGE_KEYS.CHECKOUT_DRAFT, draft, 'session');
    if (!draftResult.ok) {
      setFormError('Failed to prepare checkout draft. Please try again.');
      return;
    }

    router.push('/checkout');
  };

  const fieldClass =
    'w-full px-3 rounded-lg border border-halo-border-strong bg-white text-[15px] text-halo-ink focus:border-halo-ink focus:outline-none';

  return (
    <div className="rounded-2xl border border-halo-border bg-white p-6 shadow-[0_8px_30px_rgba(22,24,29,0.08)] space-y-5">
      <div>
        <p className="text-halo-ink tabular">
          <span className="text-2xl font-semibold">{formatPrice(listing.hourlyRate || 0, currency)}</span>
          <span className="text-halo-text-muted"> per hour</span>
        </p>
        <p className="mt-0.5 text-sm text-halo-text-muted">
          {isStudio ? `${minHours} hour minimum` : `${listing.quantity} available`}
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        Booking from {formatTime(startTime)} to {formatTime(endTime)}
      </p>

      {/* Date and time */}
      <div className="rounded-xl border border-halo-border-strong divide-y divide-halo-border-strong overflow-hidden">
        <div className="px-3 pt-2">
          <label htmlFor="booking-date" className="block text-xs font-semibold text-halo-ink">
            Date
          </label>
          <input
            id="booking-date"
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-[15px] text-halo-ink outline-none"
          />
        </div>
        <div className="grid grid-cols-2 divide-x divide-halo-border-strong">
          <div className="px-3 pt-2">
            <label htmlFor="booking-start" className="block text-xs font-semibold text-halo-ink">
              Start
            </label>
            <select
              id="booking-start"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-transparent text-[15px] text-halo-ink outline-none"
            >
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="px-3 pt-2">
            <label htmlFor="booking-duration" className="block text-xs font-semibold text-halo-ink">
              Hours
            </label>
            <select
              id="booking-duration"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full bg-transparent text-[15px] text-halo-ink outline-none"
            >
              {[2, 3, 4, 5, 6, 8, 10, 12]
                .filter((h) => h >= minHours)
                .map((h) => (
                  <option key={h} value={h}>
                    {h} hours
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {!isStudio && (
        <div>
          <label htmlFor="equipment-qty" className="block text-sm font-medium text-halo-ink mb-1">
            Quantity <span className="font-normal text-halo-text-muted">(up to {listing.quantity})</span>
          </label>
          <input
            id="equipment-qty"
            type="number"
            inputMode="numeric"
            min="1"
            max={listing.quantity}
            value={equipmentQty}
            onChange={(e) => setEquipmentQty(Math.max(1, Math.min(listing.quantity, Number(e.target.value))))}
            className={fieldClass}
          />
        </div>
      )}

      {/* Equipment from the same provider, added to a studio booking */}
      {isStudio && availableEquipmentAddOns.length > 0 && (
        <div>
          <p className="text-sm font-medium text-halo-ink mb-2">Add equipment</p>
          <ul className="space-y-2">
            {availableEquipmentAddOns.map((addon) => {
              const count = selectedAddOns[addon.id] || 0;
              return (
                <li key={addon.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-halo-ink truncate">{addon.title}</p>
                    <p className="text-[13px] text-halo-text-muted tabular">
                      {formatPrice(addon.hourlyRate, currency)} per hour, {formatPrice(addon.deposit || 0, currency)} deposit
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAddOn(addon.id, addon.quantity)}
                    aria-pressed={count > 0}
                    aria-label={count > 0 ? `${addon.title}: ${count} added. Add one more or remove` : `Add ${addon.title}`}
                    className={`shrink-0 inline-flex items-center gap-1 px-3 rounded-lg text-sm font-medium border min-h-[36px] transition-colors ${
                      count > 0
                        ? 'bg-halo-ink border-halo-ink text-white'
                        : 'bg-white border-halo-border-strong text-halo-ink hover:border-halo-ink'
                    }`}
                  >
                    {count > 0 ? (
                      <>
                        <Check className="w-4 h-4" aria-hidden="true" />
                        {count}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        Add
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Availability */}
      {!availability.available ? (
        <p className="flex items-start gap-2 text-sm text-halo-error" role="alert">
          <AlertCircle className="mt-0.5 w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{availability.reason}</span>
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm text-halo-success" role="status">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          Available at this time
        </p>
      )}

      {paused && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
          {paused}
        </p>
      )}

      {formError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-halo-error" role="alert">
          {formError}
        </p>
      )}

      <button
        type="button"
        onClick={handleProceedToCheckout}
        disabled={!availability.available || Boolean(paused)}
        className="w-full rounded-xl bg-halo-ink py-3.5 text-[15px] font-semibold text-white hover:bg-halo-ink-soft disabled:bg-halo-border-strong disabled:text-halo-text-muted disabled:cursor-not-allowed min-h-[48px]"
      >
        {isSignedIn ? 'Continue to booking' : 'Sign in to book'}
      </button>

      {/* Price breakdown */}
      <dl className="space-y-2 text-[15px] tabular">
        <div className="flex justify-between text-halo-text-muted">
          <dt>Rental, {hours} hours</dt>
          <dd className="text-halo-ink">{formatMoney(pricing.subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between text-halo-text-muted">
          <dt>Halo service fee</dt>
          <dd className="text-halo-ink">{formatMoney(pricing.fee, currency)}</dd>
        </div>
        {pricing.deposit > 0 && (
          <div className="flex justify-between text-halo-text-muted">
            <dt>Refundable deposit</dt>
            <dd className="text-halo-ink">{formatMoney(pricing.deposit, currency)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-halo-border pt-3 font-semibold text-halo-ink">
          <dt>Total</dt>
          <dd>{formatMoney(pricing.total, currency)}</dd>
        </div>
      </dl>

      <p className="text-[13px] text-center text-halo-text-muted">
        This sends a booking request. {provider?.name || 'The provider'} confirms it before it is final.
      </p>
    </div>
  );
}
