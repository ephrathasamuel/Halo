'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useScopedStorage } from '@/hooks/useAdminScope';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatMoney } from '@/lib/format';
import { STATUS_TONES, statusLabel } from '@/lib/status';
import { currencyOfProvider } from '@/lib/domain/providers';
import { moderateListing } from '@/lib/client/domain';

const STATUS_BADGES = STATUS_TONES;

export default function AdminListingsPage() {
  const { data: listings, refresh } = useScopedStorage(STORAGE_KEYS.LISTINGS);
  const { data: providers } = useScopedStorage(STORAGE_KEYS.PROVIDERS);
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  const [filter, setFilter] = useState('all');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const filtered = filter === 'all'
    ? listings
    : listings.filter((l) => l.status === filter);

  const handleDecision = async (listingId, decision) => {
    setFeedback({ type: '', text: '' });
    const res = await moderateListing(listingId, decision);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to moderate listing' });
      return;
    }
    setFeedback({
      type: 'success',
      text: `Listing status successfully updated to ${decision.toUpperCase()}!`,
    });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-halo-border">
        <h1 className="text-2xl font-semibold text-halo-ink">Listing Moderation</h1>
        <p className="text-xs text-halo-text-muted mt-1">
          Review, approve, reject, or suspend individual studio rooms and equipment packages.
        </p>
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
        {['all', 'pending', 'approved', 'rejected', 'inactive'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition min-h-[44px] ${
              filter === status
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {status} ({status === 'all' ? listings.length : listings.filter((l) => l.status === status).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-halo-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 text-xs font-semibold text-halo-text-muted border-b border-halo-border">
              <tr>
                <th scope="col" className="px-6 py-4">Listing Title</th>
                <th scope="col" className="px-6 py-4">Provider</th>
                <th scope="col" className="px-6 py-4">Type & Pricing</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halo-border">
              {filtered.map((item) => {
                const provider = providerMap.get(item.providerId);
                return (
                  <tr key={item.id} className="hover:bg-stone-50 transition">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <Link
                          href={`/listings/${item.id}`}
                          className="font-semibold text-halo-ink hover:text-halo-ink hover:underline"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-halo-text-muted line-clamp-1 max-w-xs">{item.description}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-halo-ink">
                      {provider ? provider.name : 'Unknown'}
                      <p className="text-[11px] font-normal text-halo-text-muted">{provider?.neighbourhood}</p>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <span className="capitalize font-semibold text-halo-ink block">{item.type}</span>
                      <span className="text-halo-text-muted">
                        {item.type === 'service'
                          ? `From ${formatMoney(item.startingFromHint, currencyOfProvider(item.providerId))}`
                          : `${formatMoney(item.hourlyRate, currencyOfProvider(item.providerId))}/hr`}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          STATUS_BADGES[item.status] || 'bg-stone-100'
                        }`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status !== 'approved' && (
                          <button
                            onClick={() => handleDecision(item.id, 'approved')}
                            className="px-3 py-1.5 bg-halo-ink hover:bg-halo-ink-soft text-white rounded-xl text-xs font-semibold transition min-h-[44px]"
                          >Approve
                          </button>
                        )}

                        {item.status !== 'rejected' && (
                          <button
                            onClick={() => handleDecision(item.id, 'rejected')}
                            className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition min-h-[44px]"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
