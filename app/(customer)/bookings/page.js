'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatMoney, formatDate, formatTime } from '@/lib/format';
import { exportCsv, downloadCsv } from '@/lib/csv';
import { EmptyState } from '@/components/states/EmptyState';
import { STATUS_TONES, statusLabel } from '@/lib/status';
import { currencyOfProvider } from '@/lib/domain/providers';
import { BackButton } from '@/components/ui/BackButton';

const STATUS_COLORS = STATUS_TONES;

export default function CustomerBookingsPage() {
  const { session, isSignedIn, isLoaded } = useSession();
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);

  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Wait for the stored session before showing the signed-out state
  if (!isLoaded) return <div className="min-h-[50vh]" aria-busy="true" />;

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-halo-ink">Sign in to view your bookings</h1>
        <Link
          href="/signin?next=/bookings"
          className="inline-flex items-center px-6 py-3 bg-halo-ink text-white font-semibold rounded-xl hover:bg-halo-ink-soft transition min-h-[44px]"
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-halo-ink">Booking History</h1>
          <p className="text-sm text-halo-text-muted mt-1">Review your past and upcoming rental reservations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="px-4 py-2 border border-halo-border-strong rounded-xl text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 transition disabled:opacity-50 min-h-[44px]"
          >
            Export CSV ({filtered.length})
          </button>
          <BackButton fallback="/dashboard" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-halo-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-xs font-semibold text-halo-text-muted">
            Filter Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-stone-50 border border-halo-border rounded-xl text-sm font-medium text-halo-ink focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
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

        <p className="text-xs text-halo-text-muted">
          Showing <span className="font-semibold text-halo-ink">{filtered.length}</span> record{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Bookings Table */}
      {paginated.length === 0 ? (
        <EmptyState
          title="No bookings found"
          message="You have no bookings matching the selected criteria."
        />
      ) : (
        <div className="bg-white border border-halo-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs font-semibold text-halo-text-muted border-b border-halo-border">
                <tr>
                  <th scope="col" className="px-6 py-4">Booking Ref</th>
                  <th scope="col" className="px-6 py-4">Studio / Provider</th>
                  <th scope="col" className="px-6 py-4">Date & Time</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Total</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-halo-border">
                {paginated.map((b) => {
                  const provider = providerMap.get(b.providerId);
                  return (
                    <tr key={b.id} className="hover:bg-stone-50/80 transition">
                      <td className="px-6 py-4 font-mono text-xs text-halo-text-muted">
                        #{b.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-halo-ink">
                        {provider ? provider.name : 'Unknown Studio'}
                        <p className="text-xs font-normal text-halo-text-muted">
                          {provider?.neighbourhood}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-halo-ink">{formatDate(b.date)}</p>
                        <p className="text-xs text-halo-text-muted">
                          {formatTime(b.startTime)} to {formatTime(b.endTime)} ({b.hours}h)
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            STATUS_COLORS[b.status] || 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {statusLabel(b.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-halo-ink">
                        {formatMoney(b.total, currencyOfProvider(b.providerId))}
                        <p className="text-[11px] font-normal text-halo-text-muted">
                          {b.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/bookings/${b.id}`}
                          className="inline-flex items-center text-xs font-semibold text-halo-ink hover:text-halo-ink-soft hover:underline min-h-[44px]"
                        >
                          View Receipt</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-halo-border flex items-center justify-between text-xs text-stone-600">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-halo-border bg-white hover:bg-stone-50 disabled:opacity-50 min-h-[44px]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-halo-border bg-white hover:bg-stone-50 disabled:opacity-50 min-h-[44px]"
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
