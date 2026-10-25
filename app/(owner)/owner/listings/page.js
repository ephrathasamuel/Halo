'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatMoney } from '@/lib/format';
import { deactivateListing } from '@/lib/domain/listings';
import { EmptyState } from '@/components/states/EmptyState';
import { STATUS_TONES, statusLabel } from '@/lib/status';
import { currencyOfProvider } from '@/lib/domain/providers';

const STATUS_BADGES = STATUS_TONES;

export default function OwnerListingsPage() {
  const { session } = useSession();
  const { data: listings, refresh } = useStorageSync(STORAGE_KEYS.LISTINGS, []);
  const myListings = listings.filter((l) => l.ownerId === session?.userId);

  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'studio' | 'equipment' | 'service'
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const filtered = typeFilter === 'all'
    ? myListings
    : myListings.filter((l) => l.type === typeFilter);

  const handleToggleActive = (listingId) => {
    setFeedback({ type: '', text: '' });
    const res = deactivateListing(listingId);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to toggle status' });
      return;
    }
    setFeedback({
      type: 'success',
      text: `Listing is now ${res.data.status === 'approved' ? 'Active & Published' : 'Inactive'}!`,
    });
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-halo-border">
        <div>
          <h1 className="text-2xl font-semibold text-halo-ink">Studio & Equipment Listings</h1>
          <p className="text-xs text-halo-text-muted mt-1">
            Manage your rental assets, rates, availability windows, and service packages.
          </p>
        </div>

        <Link
          href="/owner/listings/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-halo-ink text-white rounded-xl text-xs font-semibold hover:bg-halo-ink-soft transition min-h-[44px]"
        >
          Create New Listing
        </Link>
      </div>

      {feedback.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            feedback.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-halo-border pb-2 overflow-x-auto">
        {[
          { id: 'all', label: `All Listings (${myListings.length})` },
          { id: 'studio', label: `Studios (${myListings.filter((l) => l.type === 'studio').length})` },
          { id: 'equipment', label: `Equipment (${myListings.filter((l) => l.type === 'equipment').length})` },
          { id: 'service', label: `Services (${myListings.filter((l) => l.type === 'service').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap min-h-[44px] ${
              typeFilter === tab.id
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings Table / Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No listings in this category"
          message="Click Create New Listing to publish a studio room, camera kit, or filming package."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-halo-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs font-semibold text-halo-text-muted border-b border-halo-border">
                <tr>
                  <th scope="col" className="px-6 py-4">Listing Title</th>
                  <th scope="col" className="px-6 py-4">Type</th>
                  <th scope="col" className="px-6 py-4">Rate / Pricing</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Specs</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-halo-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <Link
                          href={`/listings/${item.id}`}
                          className="font-semibold text-halo-ink hover:text-halo-ink hover:underline text-sm"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-halo-text-muted line-clamp-1 max-w-xs">
                          {item.description}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700">
                        {item.type}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-halo-ink">
                      {item.type === 'service' ? (
                        <span className="text-xs text-stone-600">
                          From {formatMoney(item.startingFromHint, currencyOfProvider(item.providerId))} (Quote)
                        </span>
                      ) : (
                        <span>{formatMoney(item.hourlyRate, currencyOfProvider(item.providerId))} / hour</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          STATUS_BADGES[item.status] || 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-halo-text-muted">
                      {item.type === 'studio' && (
                        <span>
                          {item.capacity} pers, Min {item.minHours}h, {item.bufferMinutes}m buffer
                        </span>
                      )}
                      {item.type === 'equipment' && (
                        <span>
                          Qty: {item.quantity}, Deposit: {formatMoney(item.deposit, currencyOfProvider(item.providerId))}, {item.condition}
                        </span>
                      )}
                      {item.type === 'service' && (
                        <span>{item.eventTypes?.slice(0, 2).join(', ')}...</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.type === 'studio' && (
                          <Link
                            href={`/owner/listings/${item.id}/availability`}
                            className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition min-h-[44px] flex items-center"
                          >
                            Availability
                          </Link>
                        )}

                        <Link
                          href={`/owner/listings/${item.id}/edit`}
                          className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition min-h-[44px] flex items-center"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => handleToggleActive(item.id)}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition min-h-[44px] ${
                            item.status === 'approved'
                            ? 'text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {item.status === 'approved' ? 'Pause' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
