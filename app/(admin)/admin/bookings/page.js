'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatTime, formatETB } from '@/lib/format';

const STATUS_BADGES = {
  requested: 'bg-amber-100 text-amber-800 border-amber-300',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-purple-100 text-purple-800 border-purple-300',
  declined: 'bg-slate-100 text-slate-800 border-slate-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  reviewed: 'bg-teal-100 text-teal-800 border-teal-300',
  disputed: 'bg-rose-100 text-rose-800 border-rose-300',
};

export default function AdminBookingsPage() {
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);

  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Booking Ledger</h1>
        <p className="text-xs text-slate-500 mt-1">
          Master transaction log across all creative studios, equipment rentals, and productions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {['all', 'requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition min-h-[44px] ${
              filter === status
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status} ({status === 'all' ? bookings.length : bookings.filter((b) => b.status === status).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => {
                const provider = providerMap.get(b.providerId);
                const renter = userMap.get(b.renterId);

                return (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      #{b.id.slice(0, 8)}
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-900">
                      {provider ? provider.name : 'Unknown Studio'}
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <p className="font-semibold text-slate-800">{renter?.name || 'Renter'}</p>
                      <p className="text-slate-400">{renter?.email}</p>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <p className="font-bold text-slate-800">{formatDate(b.date)}</p>
                      <p className="text-slate-500">{formatTime(b.startTime)} — {formatTime(b.endTime)}</p>
                    </td>

                    <td className="px-6 py-4 font-black text-slate-900 text-xs">
                      {formatETB(b.total)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          STATUS_BADGES[b.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="text-xs font-semibold text-halo-primary hover:underline min-h-[44px] inline-flex items-center"
                      >
                        Receipt →
                      </Link>
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
