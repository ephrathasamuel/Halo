'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatETB } from '@/lib/format';
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

  const isStudio = listing.type === 'studio';
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
      createdAt: new Date().toISOString(),
    };

    const draftResult = writeStorage(STORAGE_KEYS.CHECKOUT_DRAFT, draft, 'session');
    if (!draftResult.ok) {
      setFormError('Failed to prepare checkout draft. Please try again.');
      return;
    }

    router.push('/checkout');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Configure Reservation</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Live conflict checking against studio calendar & opening hours
        </p>
      </div>

      {/* Date & Time Selectors */}
      <div className="space-y-4">
        <div>
          <label htmlFor="booking-date" className="block text-xs font-semibold text-slate-700 mb-1">
            Date
          </label>
          <input
            id="booking-date"
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium min-h-[44px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="booking-start" className="block text-xs font-semibold text-slate-700 mb-1">
              Start Time
            </label>
            <select
              id="booking-start"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium bg-white min-h-[44px]"
            >
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="booking-duration" className="block text-xs font-semibold text-slate-700 mb-1">
              Duration
            </label>
            <select
              id="booking-duration"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium bg-white min-h-[44px]"
            >
              {[2, 3, 4, 5, 6, 8, 10, 12]
                .filter((h) => h >= minHours)
                .map((h) => (
                  <option key={h} value={h}>
                    {h} hours ({startTime} - {minutesToTime(timeToMinutes(startTime) + h * 60)})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Equipment quantity selector if equipment */}
        {!isStudio && (
          <div>
            <label htmlFor="equipment-qty" className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity (Max available: {listing.quantity})
            </label>
            <input
              id="equipment-qty"
              type="number"
              min="1"
              max={listing.quantity}
              value={equipmentQty}
              onChange={(e) => setEquipmentQty(Math.max(1, Math.min(listing.quantity, Number(e.target.value))))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium min-h-[44px]"
            />
          </div>
        )}

        {/* Studio Equipment Add-ons */}
        {isStudio && availableEquipmentAddOns.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="block text-xs font-semibold text-slate-700">
              Optional Studio Equipment Add-ons
            </span>
            <div className="space-y-1.5">
              {availableEquipmentAddOns.map((addon) => {
                const count = selectedAddOns[addon.id] || 0;
                return (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{addon.title}</span>
                      <span className="text-slate-500 block">
                        +{formatETB(addon.hourlyRate)}/hr • Deposit: {formatETB(addon.deposit)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAddOn(addon.id, addon.quantity)}
                      className={`px-3 py-1.5 rounded-md font-semibold min-h-[36px] transition-colors ${
                        count > 0
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {count > 0 ? `Added (${count})` : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Availability Status Alert */}
      {!availability.available ? (
        <div
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2"
          role="alert"
        >
          <span className="text-base select-none">⚠️</span>
          <span>{availability.reason}</span>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
          <span>✓</span>
          <span>Time slot is available with buffer and stock verified</span>
        </div>
      )}

      {/* Form Error Alert */}
      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700" role="alert">
          {formError}
        </div>
      )}

      {/* Price Breakdown Calculation */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs border border-slate-100">
        <div className="flex justify-between text-slate-600">
          <span>Rental Subtotal ({hours} hrs)</span>
          <span className="font-semibold text-slate-800">{formatETB(pricing.subtotal)}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Platform Fee (10%)</span>
          <span className="font-semibold text-slate-800">{formatETB(pricing.fee)}</span>
        </div>

        {pricing.deposit > 0 && (
          <div className="flex justify-between text-amber-700 pt-1 border-t border-slate-200/60 font-medium">
            <span>Equipment Deposit (Refundable)</span>
            <span className="font-bold">{formatETB(pricing.deposit)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
          <span>Total Demo Payable</span>
          <span className="text-base">{formatETB(pricing.total)}</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={handleProceedToCheckout}
        disabled={!availability.available}
        className={`w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition-all min-h-[44px] ${
          availability.available
            ? 'hover:opacity-95 cursor-pointer shadow-lg'
            : 'bg-slate-300 cursor-not-allowed'
        }`}
        style={availability.available ? { backgroundColor: provider?.brandColor || '#1E3A5F' } : undefined}
      >
        {!isSignedIn
          ? 'Sign In to Book'
          : 'Proceed to Demo Checkout →'}
      </button>

      <p className="text-[11px] text-center text-slate-400">
        Simulated TeleBirr checkout • Free cancellation until 24h prior
      </p>
    </div>
  );
}
