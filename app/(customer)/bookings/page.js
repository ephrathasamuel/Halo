'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatETB, formatDate, formatTime } from '@/lib/format';
import { exportCsv, downloadCsv } from '@/lib/csv';
import { EmptyState } from '@/components/states/EmptyState';

const STATUS_COLORS = {
  requested: 'bg-amber-100 text-amber-800 border-amber-300',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-purple-100 text-purple-800 border-purple-300',
  declined: 'bg-slate-100 text-slate-800 border-slate-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  reviewed: 'bg-teal-100 text-teal-800 border-teal-300',
  disputed: 'bg-rose-100 text-rose-800 border-rose-300',
};

export default function CustomerBookingsPage() {
  const { session, isSignedIn } = useSession();
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);

  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to view your bookings</h1>
        <Link
          href="/signin?next=/bookings"
          className="inline-flex items-center px-6 py-3 bg-halo-primary text-white font-semibold rounded-xl hover:bg-halo-primary-light transition min-h-[44px]"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const myBookings = bookings.filter((b) => b.renterId === session.userId);
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  let filtered = myBookings;
  if (statusFilter !== 'all') {
    filtered = myBookings.filter((b) => b.status === statusFilter);
  }

  // Sort newest date first
  filtered.sort((a, b) => new Date(b.date + 'T' + b.startTime) - new Date(a.date + 'T' + a.startTime));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCsv = () => {
    const columns = [
      { key: 'id', label: 'Booking ID' },
      { key: 'providerName', label: 'Studio / Provider' },
      { key: 'date', label: 'Date' },
      { key: 'startTime', label: 'Start Time' },
      { key: 'endTime', label: 'End Time' },
      { key: 'hours', label: 'Duration (h)' },
      { key: 'status', label: 'Status' },
      { key: 'subtotal', label: 'Subtotal (ETB)' },
      { key: 'deposit', label: 'Deposit (ETB)' },
      { key: 'fee', label: 'Platform Fee (ETB)' },
      { key: 'total', label: 'Total (ETB)' },
      { key: 'paymentStatus', label: 'Payment Status' },
    ];

    const rows = filtered.map((b) => ({
      id: b.id,
      providerName: providerMap.get(b.providerId)?.name || 'Unknown',
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      hours: b.hours,
      status: b.status,
      subtotal: b.subtotal,
      deposit: b.deposit,
      fee: b.fee,
      total: b.total,
      paymentStatus: b.paymentStatus,
    }));

    const csvData = exportCsv(rows, columns);
    downloadCsv(csvData, `halo-bookings-export-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Booking History</h1>
          <p className="text-sm text-slate-500 mt-1">Review your past and upcoming rental reservations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm disabled:opacity-50 min-h-[44px]"
          >
            📥 Export CSV ({filtered.length})
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-medium transition min-h-[44px] flex items-center"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Filter Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
          >
            <option value="all">All Statuses ({myBookings.length})</option>
            <option value="requested">Requested</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="reviewed">Reviewed</option>
            <option value="cancelled">Cancelled</option>
            <option value="declined">Declined</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>

        <p className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> record{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Bookings Table */}
      {paginated.length === 0 ? (
        <EmptyState
          title="No bookings found"
          message="You have no bookings matching the selected criteria."
          icon="📋"
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Booking Ref</th>
                  <th scope="col" className="px-6 py-4">Studio / Provider</th>
                  <th scope="col" className="px-6 py-4">Date & Time</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Total</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((b) => {
                  const provider = providerMap.get(b.providerId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        #{b.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {provider ? provider.name : 'Unknown Studio'}
                        <p className="text-xs font-normal text-slate-400">
                          {provider?.neighbourhood}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{formatDate(b.date)}</p>
                        <p className="text-xs text-slate-500">
                          {formatTime(b.startTime)} — {formatTime(b.endTime)} ({b.hours}h)
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            STATUS_COLORS[b.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatETB(b.total)}
                        <p className="text-[11px] font-normal text-slate-400">
                          {b.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/bookings/${b.id}`}
                          className="inline-flex items-center text-xs font-semibold text-halo-primary hover:text-halo-primary-light hover:underline min-h-[44px]"
                        >
                          View Receipt →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 min-h-[44px]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 min-h-[44px]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
