'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { saveListing } from '@/lib/domain/listings';

const EQUIPMENT_CATEGORIES = ['Camera', 'Lighting', 'Audio', 'Lens', 'Aerial', 'Support', 'Props', 'Other'];
const COMMON_AMENITIES = ['Cyclorama wall', 'Lighting rigs', 'Climate control', 'Makeup room', 'Wi-Fi', 'Parking', 'Sound isolation', 'Natural light'];
const ALL_EVENT_TYPES = ['Wedding', 'Engagement', 'Corporate Event', 'Birthday', 'Music Video', 'Commercial', 'Conference', 'Product Launch'];

export function ListingForm({ initialListing = null }) {
  const router = useRouter();
  const { session } = useSession();
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.ownerId === session?.userId);

  const [type, setType] = useState(initialListing?.type || 'studio');
  const [title, setTitle] = useState(initialListing?.title || '');
  const [description, setDescription] = useState(initialListing?.description || '');
  const [photosText, setPhotosText] = useState(
    initialListing?.photos?.join('\n') || '/images/listings/b-light-studio-1.jpg'
  );

  // Studio fields
  const [hourlyRate, setHourlyRate] = useState(initialListing?.hourlyRate || 500);
  const [minHours, setMinHours] = useState(initialListing?.minHours || 2);
  const [capacity, setCapacity] = useState(initialListing?.capacity || 10);
  const [bufferMinutes, setBufferMinutes] = useState(initialListing?.bufferMinutes || 30);
  const [amenities, setAmenities] = useState(initialListing?.amenities || ['Wi-Fi', 'Lighting rigs']);

  // Equipment fields
  const [category, setCategory] = useState(initialListing?.category || 'Camera');
  const [deposit, setDeposit] = useState(initialListing?.deposit || 2000);
  const [quantity, setQuantity] = useState(initialListing?.quantity || 1);
  const [condition, setCondition] = useState(initialListing?.condition || 'Excellent');

  // Service fields
  const [startingFromHint, setStartingFromHint] = useState(initialListing?.startingFromHint || 15000);
  const [eventTypes, setEventTypes] = useState(initialListing?.eventTypes || ['Wedding', 'Engagement']);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!provider) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600">No registered provider found for this user account.</p>
      </div>
    );
  }

  const toggleAmenity = (item) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const toggleEventType = (item) => {
    setEventTypes((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const photos = photosText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const payload = {
      id: initialListing?.id,
      providerId: provider.id,
      type,
      title,
      description,
      photos: photos.length > 0 ? photos : ['/images/listings/b-light-studio-1.jpg'],
      status: initialListing?.status || 'approved',
      hourlyRate: Number(hourlyRate),
      minHours: Number(minHours),
      capacity: Number(capacity),
      bufferMinutes: Number(bufferMinutes),
      amenities,
      category,
      deposit: Number(deposit),
      quantity: Number(quantity),
      condition,
      startingFromHint: Number(startingFromHint),
      eventTypes,
      blockedDates: initialListing?.blockedDates || [],
    };

    const res = saveListing(payload);
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'Failed to save listing');
      return;
    }

    router.push('/owner/listings');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Listing Type Selector */}
      {!initialListing && (
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Listing Type *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'studio', label: 'Studio Space', desc: 'Hourly rental with time slots' },
              { id: 'equipment', label: 'Equipment Gear', desc: 'Cameras, lenses, lights & audio' },
              { id: 'service', label: 'Filming Service', desc: 'Weddings & corporate events' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`p-4 rounded-2xl border text-left transition min-h-[44px] ${
                  type === t.id
                    ? 'border-halo-primary bg-halo-primary/5 ring-2 ring-halo-primary'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-bold text-sm text-slate-900">{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Common Details */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="listing-title" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Listing Title *
          </label>
          <input
            id="listing-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Main Cyclorama Studio Room or Cinema Camera Kit"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="listing-description" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Description
          </label>
          <textarea
            id="listing-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide technical specifications, dimensions, included accessories..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="photos-text" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Photos (One URL per line)
          </label>
          <textarea
            id="photos-text"
            rows={2}
            value={photosText}
            onChange={(e) => setPhotosText(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-halo-primary"
          />
        </div>
      </div>

      {/* Type Specific Fields */}
      {type === 'studio' && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Studio Specifications</h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="hourly-rate" className="block text-xs text-slate-600">Hourly Rate (ETB) *</label>
              <input
                id="hourly-rate"
                type="number"
                min="50"
                step="50"
                required
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="min-hours" className="block text-xs text-slate-600">Min Booking (Hours) *</label>
              <input
                id="min-hours"
                type="number"
                min="1"
                max="12"
                required
                value={minHours}
                onChange={(e) => setMinHours(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="capacity" className="block text-xs text-slate-600">Capacity (People) *</label>
              <input
                id="capacity"
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="buffer-minutes" className="block text-xs text-slate-600">Buffer / Turnover (Min) *</label>
              <select
                id="buffer-minutes"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
              >
                <option value="0">0 mins (No buffer)</option>
                <option value="15">15 mins cleanup</option>
                <option value="30">30 mins buffer (Standard)</option>
                <option value="45">45 mins buffer</option>
                <option value="60">60 mins buffer</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="block text-xs text-slate-600">Available Amenities:</span>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((am) => {
                const active = amenities.includes(am);
                return (
                  <button
                    key={am}
                    type="button"
                    onClick={() => toggleAmenity(am)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition min-h-[44px] ${
                      active
                        ? 'bg-halo-primary text-white border-halo-primary'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '} {am}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {type === 'equipment' && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Equipment Specifications</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="category" className="block text-xs text-slate-600">Category *</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
              >
                {EQUIPMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="eq-rate" className="block text-xs text-slate-600">Hourly Rate (ETB) *</label>
              <input
                id="eq-rate"
                type="number"
                min="20"
                step="10"
                required
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="deposit" className="block text-xs text-slate-600">Refundable Deposit (ETB) *</label>
              <input
                id="deposit"
                type="number"
                min="0"
                step="500"
                required
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="quantity" className="block text-xs text-slate-600">Total Units in Stock *</label>
              <input
                id="quantity"
                type="number"
                min="1"
                max="50"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="condition" className="block text-xs text-slate-600">Condition *</label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
              >
                <option value="Brand New">Brand New</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {type === 'service' && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Filming Service Package</h3>

          <div className="space-y-1.5 max-w-xs">
            <label htmlFor="starting-from" className="block text-xs text-slate-600">Starting Price Guide (ETB) *</label>
            <input
              id="starting-from"
              type="number"
              min="1000"
              step="1000"
              required
              value={startingFromHint}
              onChange={(e) => setStartingFromHint(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
            />
            <p className="text-[11px] text-slate-400">All services are custom-quoted per client request.</p>
          </div>

          <div className="space-y-2 pt-2">
            <span className="block text-xs text-slate-600">Covered Event Types (Select at least one):</span>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENT_TYPES.map((et) => {
                const active = eventTypes.includes(et);
                return (
                  <button
                    key={et}
                    type="button"
                    onClick={() => toggleEventType(et)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition min-h-[44px] ${
                      active
                        ? 'bg-halo-primary text-white border-halo-primary'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '} {et}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/owner/listings')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 min-h-[44px]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-halo-primary text-white font-bold rounded-xl hover:bg-halo-primary-light transition shadow disabled:opacity-50 min-h-[44px]"
        >
          {isSubmitting ? 'Saving Listing...' : initialListing ? 'Update Listing' : 'Publish Listing'}
        </button>
      </div>
    </form>
  );
}
