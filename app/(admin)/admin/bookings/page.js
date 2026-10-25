'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useScopedStorage } from '@/hooks/useAdminScope';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatTime, formatMoney } from '@/lib/format';
import { STATUS_TONES, statusLabel } from '@/lib/status';
import { currencyOfProvider } from '@/lib/domain/providers';

const STATUS_BADGES = STATUS_TONES;

export default function AdminBookingsPage() {
  const { data: bookings } = useScopedStorage(STORAGE_KEYS.BOOKINGS);
  const { data: providers } = useScopedStorage(STORAGE_KEYS.PROVIDERS);
  const { data: users } = useScopedStorage(STORAGE_KEYS.USERS);

  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-halo-border">
        <h1 className="text-2xl font-semibold text-halo-ink">Platform Booking Ledger</h1>
        <p className="text-xs text-halo-text-muted mt-1">
          Master transaction log across all creative studios, equipment rentals, and productions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-halo-border pb-2 overflow-x-auto">
        {['all', 'requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition min-h-[44px] ${
              filter === status
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {status} ({status === 'all' ? bookings.length : bookings.filter((b) => b.status === status).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-halo-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 text-xs font-semibold text-halo-text-muted border-b border-halo-border">
              <tr>
                <th scope="col" className="px-6 py-4">Booking Ref</th>
                <th scope="col" className="px-6 py-4">Provider</th>
                <th scope="col" className="px-6 py-4">Renter</th>
                <th scope="col" className="px-6 py-4">Date & Time</th>
                <th scope="col" className="px-6 py-4">Total</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halo-border">
              {filtered.map((b) => {
                const provider = providerMap.get(b.providerId);
                const renter = userMap.get(b.renterId);

                return (
                  <tr key={b.id} className="hover:bg-stone-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-halo-text-muted">
                      #{b.id.slice(-6)}
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-halo-ink">
                      {provider ? provider.name : 'Unknown Studio'}
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <p className="font-semibold text-halo-ink">{renter?.name || 'Renter'}</p>
                      <p className="text-halo-text-muted">{renter?.email}</p>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <p className="font-semibold text-halo-ink">{formatDate(b.date)}</p>
                      <p className="text-halo-text-muted">{formatTime(b.startTime)} to {formatTime(b.endTime)}</p>
                    </td>

                    <td className="px-6 py-4 font-semibold text-halo-ink text-xs">
                      {formatMoney(b.total, currencyOfProvider(b.providerId))}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          STATUS_BADGES[b.status] || 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {statusLabel(b.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="text-xs font-semibold text-halo-ink hover:underline min-h-[44px] inline-flex items-center"
                      >
                        Receipt</Link>
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
