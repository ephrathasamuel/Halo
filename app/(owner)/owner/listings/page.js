'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatETB } from '@/lib/format';
import { deactivateListing } from '@/lib/domain/listings';
import { EmptyState } from '@/components/states/EmptyState';

const STATUS_BADGES = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Studio & Equipment Listings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your rental assets, rates, availability windows, and service packages.
          </p>
        </div>

        <Link
          href="/owner/listings/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-halo-primary text-white rounded-xl text-xs font-bold hover:bg-halo-primary-light transition shadow min-h-[44px]"
        >
          <span>➕</span> Create New Listing
        </Link>
      </div>

      {feedback.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border shadow-sm ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? '⚠️ ' : '✓ '}
          {feedback.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: `All Listings (${myListings.length})` },
          { id: 'studio', label: `Studios (${myListings.filter((l) => l.type === 'studio').length})` },
          { id: 'equipment', label: `Equipment (${myListings.filter((l) => l.type === 'equipment').length})` },
          { id: 'service', label: `Services (${myListings.filter((l) => l.type === 'service').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[44px] ${
              typeFilter === tab.id
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
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
          icon="📦"
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Listing Title</th>
                  <th scope="col" className="px-6 py-4">Type</th>
                  <th scope="col" className="px-6 py-4">Rate / Pricing</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Specs</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <Link
                          href={`/listings/${item.id}`}
                          className="font-bold text-slate-900 hover:text-halo-primary hover:underline text-sm"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                          {item.description}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                        {item.type}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.type === 'service' ? (
                        <span className="text-xs text-slate-600">
                          From {formatETB(item.startingFromHint)} (Quote)
                        </span>
                      ) : (
                        <span>{formatETB(item.hourlyRate)} / hour</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          STATUS_BADGES[item.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {item.type === 'studio' && (
                        <span>
                          👥 {item.capacity} pers • ⏱ Min {item.minHours}h • 🛡 {item.bufferMinutes}m buffer
                        </span>
                      )}
                      {item.type === 'equipment' && (
                        <span>
                          📦 Qty: {item.quantity} • 💰 Deposit: {formatETB(item.deposit)} • {item.condition}
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
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition min-h-[44px] flex items-center"
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
