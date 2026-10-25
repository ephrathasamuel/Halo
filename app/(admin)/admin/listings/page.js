'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatETB } from '@/lib/format';
import { moderateListing } from '@/lib/domain/listings';

const STATUS_BADGES = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AdminListingsPage() {
  const { data: listings, refresh } = useStorageSync(STORAGE_KEYS.LISTINGS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  const [filter, setFilter] = useState('all');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const filtered = filter === 'all'
    ? listings
    : listings.filter((l) => l.status === filter);

  const handleDecision = (listingId, decision) => {
    setFeedback({ type: '', text: '' });
    const res = moderateListing(listingId, decision);
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
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Listing Moderation</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, approve, reject, or suspend individual studio rooms and equipment packages.
        </p>
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
        {['all', 'pending', 'approved', 'rejected', 'inactive'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition min-h-[44px] ${
              filter === status
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status} ({status === 'all' ? listings.length : listings.filter((l) => l.status === status).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4">Listing Title</th>
                <th scope="col" className="px-6 py-4">Provider</th>
                <th scope="col" className="px-6 py-4">Type & Pricing</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const provider = providerMap.get(item.providerId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <Link
                          href={`/listings/${item.id}`}
                          className="font-bold text-slate-900 hover:text-halo-primary hover:underline"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">{item.description}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                      {provider ? provider.name : 'Unknown'}
                      <p className="text-[11px] font-normal text-slate-400">{provider?.neighbourhood}</p>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <span className="capitalize font-semibold text-slate-900 block">{item.type}</span>
                      <span className="text-slate-500">
                        {item.type === 'service'
                          ? `From ${formatETB(item.startingFromHint)}`
                          : `${formatETB(item.hourlyRate)}/hr`}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          STATUS_BADGES[item.status] || 'bg-slate-100'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status !== 'approved' && (
                          <button
                            onClick={() => handleDecision(item.id, 'approved')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm min-h-[44px]"
                          >
                            ✓ Approve
                          </button>
                        )}

                        {item.status !== 'rejected' && (
                          <button
                            onClick={() => handleDecision(item.id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition min-h-[44px]"
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
