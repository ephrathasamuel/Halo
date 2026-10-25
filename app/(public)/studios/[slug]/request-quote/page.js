'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { submitEventRequest } from '@/lib/domain/events';
import { formatMoney } from '@/lib/format';
import { currencyOfProvider } from '@/lib/domain/providers';
import { BackButton } from '@/components/ui/BackButton';

const EVENT_TYPES = ['Wedding', 'Engagement', 'Corporate Event', 'Birthday', 'Music Video', 'Commercial', 'Conference', 'Other'];

export default function RequestQuotePage({ params }) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  const router = useRouter();
  const { isSignedIn, isLoaded } = useSession();

  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: listings } = useStorageSync(STORAGE_KEYS.LISTINGS, []);

  const provider = providers.find((p) => p.slug === slug);
  const serviceListings = provider
    ? listings.filter((l) => l.providerId === provider.id && l.type === 'service' && l.status === 'approved')
    : [];

  const [selectedListingId, setSelectedListingId] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState(8);
  const [location, setLocation] = useState('');
  const [coverage, setCoverage] = useState('');
  const [budgetHint, setBudgetHint] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!provider) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Studio Not Found</h1>
        <Link href="/studios" className="text-sm font-semibold text-halo-primary hover:underline">
          Browse all studios
        </Link>
      </div>
    );
  }

  // Wait for the stored session before showing the signed-out state
  if (!isLoaded) return <div className="min-h-[50vh]" aria-busy="true" />;

  if (!isSignedIn) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Sign in to request an event quote</h2>
        <p className="text-sm text-slate-600">
          Sign in or create an account to ask {provider.name} for a wedding or event filming quote.
        </p>
        <Link
          href={`/signin?next=/studios/${slug}/request-quote`}
          className="inline-flex items-center justify-center px-6 py-3 bg-halo-primary text-white font-bold rounded-xl hover:bg-halo-primary-light transition min-h-[44px]"
        >
          Sign In as Renter
        </Link>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const listingId = selectedListingId || (serviceListings[0]?.id || '');

    const res = submitEventRequest({
      providerId: provider.id,
      listingId,
      eventType,
      date,
      startTime,
      durationHours: Number(durationHours),
      location,
      coverage,
      budgetHint: budgetHint ? Number(budgetHint) : undefined,
      notes,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'Failed to submit event request');
      return;
    }

    router.push(`/events/${res.data.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Request Event Filming Quote
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct inquiry to <span className="font-bold text-slate-800">{provider.name}</span> in {provider.neighbourhood}
          </p>
        </div>

        <BackButton fallback={`/studios/${slug}`} />
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        {/* Service Package Selector */}
        {serviceListings.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="service-listing" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Filming Service Package
            </label>
            <select
              id="service-listing"
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            >
              {serviceListings.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} (Starting from {formatMoney(s.startingFromHint, currencyOfProvider(s.providerId))})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Event Type & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="event-type" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Event Type *
            </label>
            <select
              id="event-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="event-date" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Event Date *
            </label>
            <input
              id="event-date"
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>
        </div>

        {/* Timing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="start-time" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Start Time *
            </label>
            <input
              id="start-time"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="duration" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Estimated Duration (Hours) *
            </label>
            <input
              id="duration"
              type="number"
              min="1"
              max="24"
              required
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>
        </div>

        {/* Venue Location */}
        <div className="space-y-1.5">
          <label htmlFor="location" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Event Venue / Location (in Addis Ababa or beyond) *
          </label>
          <input
            id="location"
            type="text"
            required
            placeholder="e.g. Sheraton Addis, Skylight Hotel, or Entoto Park"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
          />
        </div>

        {/* Scope & Coverage */}
        <div className="space-y-1.5">
          <label htmlFor="coverage" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Desired Coverage & Deliverables *
          </label>
          <textarea
            id="coverage"
            rows={3}
            required
            placeholder="e.g. Full ceremony and evening reception, 2-3 camera operators, drone aerials, same-day highlight reel..."
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary"
          />
        </div>

        {/* Budget Hint & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="budget" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Estimated Budget Guide (ETB)
            </label>
            <input
              id="budget"
              type="number"
              min="1000"
              step="1000"
              placeholder="e.g. 25000"
              value={budgetHint}
              onChange={(e) => setBudgetHint(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Additional Notes
            </label>
            <input
              id="notes"
              type="text"
              placeholder="Special cultural traditions, guest count..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Link
            href={`/studios/${slug}`}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 min-h-[44px] flex items-center"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-halo-primary text-white font-bold rounded-xl hover:bg-halo-primary-light transition shadow disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Submitting Request...' : 'Submit Quote Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
