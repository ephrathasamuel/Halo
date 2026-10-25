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

export default function CustomerDashboardPage() {
  const { session, isSignedIn } = useSession();
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: reviews } = useStorageSync(STORAGE_KEYS.REVIEWS, []);
  const { data: disputes } = useStorageSync(STORAGE_KEYS.DISPUTES, []);

  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'upcoming' | 'completed' | 'cancelled'

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to view your dashboard</h1>
        <p className="text-slate-600">Track upcoming bookings, manage shoots, and export receipts.</p>
        <Link
          href="/signin?next=/dashboard"
          className="inline-flex items-center justify-center px-6 py-3 bg-halo-primary text-white font-semibold rounded-xl hover:bg-halo-primary-light transition shadow min-h-[44px]"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Filter to renter's own bookings
  const myBookings = bookings.filter((b) => b.renterId === session.userId);
  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const myReviews = new Set(reviews.filter((r) => r.renterId === session.userId).map((r) => r.targetId));
  const myDisputes = disputes.filter((d) => d.openedBy === session.userId && d.status === 'open');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Derived metrics
  const upcomingBookings = myBookings.filter(
    (b) => ['confirmed', 'requested', 'in_progress'].includes(b.status) && b.date >= todayStr
  );
  const completedBookings = myBookings.filter((b) => ['completed', 'reviewed'].includes(b.status));
  const cancelledBookings = myBookings.filter((b) => ['cancelled', 'declined'].includes(b.status));

  // Derived alerts
  const needsReviewBookings = myBookings.filter(
    (b) => b.status === 'completed' && !myReviews.has(b.id)
  );

  const sevenDaysAhead = new Date();
  sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);
  const sevenDaysStr = sevenDaysAhead.toISOString().slice(0, 10);

  const imminentShoots = upcomingBookings.filter(
    (b) => b.status === 'confirmed' && b.date <= sevenDaysStr
  );

  // Filtered view
  let displayedBookings = myBookings;
  if (filterTab === 'upcoming') displayedBookings = upcomingBookings;
  if (filterTab === 'completed') displayedBookings = completedBookings;
  if (filterTab === 'cancelled') displayedBookings = cancelledBookings;

  // Sort descending by date
  displayedBookings.sort((a, b) => new Date(b.date + 'T' + b.startTime) - new Date(a.date + 'T' + a.startTime));

  const totalSpent = myBookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.total || 0), 0);

  const handleExportCsv = () => {
    const columns = [
      { key: 'id', label: 'Booking ID' },
      { key: 'providerName', label: 'Studio / Provider' },
      { key: 'date', label: 'Date' },
      { key: 'time', label: 'Time Window' },
      { key: 'status', label: 'Status' },
      { key: 'subtotal', label: 'Subtotal (ETB)' },
      { key: 'deposit', label: 'Deposit (ETB)' },
      { key: 'fee', label: 'Platform Fee (ETB)' },
      { key: 'total', label: 'Total (ETB)' },
      { key: 'paymentStatus', label: 'Payment Status' },
    ];

    const rows = myBookings.map((b) => {
      const p = providerMap.get(b.providerId);
      return {
        id: b.id,
        providerName: p ? p.name : 'Unknown',
        date: b.date,
        time: `${b.startTime} - ${b.endTime}`,
        status: b.status,
        subtotal: b.subtotal,
        deposit: b.deposit,
        fee: b.fee,
        total: b.total,
        paymentStatus: b.paymentStatus,
      };
    });

    const csvData = exportCsv(rows, columns);
    downloadCsv(csvData, `halo-my-bookings-${todayStr}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Persona Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Renter Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              {session.roles?.join(', ')}
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Welcome back, <span className="font-medium text-slate-800">{session.name}</span> ({session.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={myBookings.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm disabled:opacity-50 min-h-[44px]"
          >
            <span>📥</span> Export Bookings CSV
          </button>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-4 py-2 bg-halo-primary text-white rounded-xl text-sm font-semibold hover:bg-halo-primary-light transition shadow-sm min-h-[44px]"
          >
            Book New Shoot
          </Link>
        </div>
      </div>

      {/* Derived Alerts Section */}
      {(imminentShoots.length > 0 || needsReviewBookings.length > 0 || myDisputes.length > 0) && (
        <section aria-label="Actionable notifications" className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Alerts & Attention Needed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imminentShoots.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm"
              >
                <span className="text-2xl">📅</span>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">Upcoming Shoot Soon!</p>
                  <p className="text-xs text-amber-700">
                    {formatDate(b.date)} at {formatTime(b.startTime)} — {providerMap.get(b.providerId)?.name}
                  </p>
                  <Link
                    href={`/bookings/${b.id}`}
                    className="inline-block text-xs font-bold text-amber-900 underline hover:no-underline pt-1 min-h-[44px] flex items-center"
                  >
                    View Shoot Details →
                  </Link>
                </div>
              </div>
            ))}

            {needsReviewBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-start gap-3 shadow-sm"
              >
                <span className="text-2xl">⭐</span>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">Leave a Review</p>
                  <p className="text-xs text-teal-700">
                    Shoot on {formatDate(b.date)} at {providerMap.get(b.providerId)?.name} is complete.
                  </p>
                  <Link
                    href={`/bookings/${b.id}/review`}
                    className="inline-block text-xs font-bold text-teal-900 underline hover:no-underline pt-1 min-h-[44px] flex items-center"
                  >
                    Rate & Review Provider →
                  </Link>
                </div>
              </div>
            ))}

            {myDisputes.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-sm"
              >
                <span className="text-2xl">⚠️</span>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">Active Dispute Pending Resolution</p>
                  <p className="text-xs text-rose-700">{d.reason}: {d.description.slice(0, 50)}...</p>
                  <span className="inline-block text-xs font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                    Under Review by Admin
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Bookings</p>
          <p className="text-2xl font-black text-slate-900">{myBookings.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Upcoming Shoots</p>
          <p className="text-2xl font-black text-emerald-700">{upcomingBookings.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-purple-600">Completed</p>
          <p className="text-2xl font-black text-purple-700">{completedBookings.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Spend</p>
          <p className="text-2xl font-black text-slate-900">{formatETB(totalSpent)}</p>
        </div>
      </div>

      {/* Filter Tabs & History List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'all', label: `All (${myBookings.length})` },
            { id: 'upcoming', label: `Upcoming (${upcomingBookings.length})` },
            { id: 'completed', label: `Completed (${completedBookings.length})` },
            { id: 'cancelled', label: `Cancelled (${cancelledBookings.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap min-h-[44px] ${
                filterTab === tab.id
                  ? 'bg-halo-primary text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {displayedBookings.length === 0 ? (
          <EmptyState
            title="No bookings match this filter"
            message="Check other tabs or book a new creative studio or equipment kit."
            icon="🎬"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedBookings.map((b) => {
              const provider = providerMap.get(b.providerId);
              return (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          STATUS_COLORS[b.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        #{b.id.slice(0, 8)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {provider ? provider.name : 'Creative Studio'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        📍 {provider?.neighbourhood || 'Addis Ababa'} • 📅 {formatDate(b.date)} • ⏰ {formatTime(b.startTime)} — {formatTime(b.endTime)} ({b.hours}h)
                      </p>
                    </div>

                    {/* Booked Items Preview */}
                    <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 border border-slate-100">
                      <p className="font-semibold text-slate-700 mb-1">Booked Items:</p>
                      {b.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-600">
                          <span>
                            {item.qty}x {item.type} ({formatETB(item.rateSnapshot)}/h)
                          </span>
                          <span className="font-medium text-slate-800">{formatETB(item.lineTotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Total Price</p>
                      <p className="text-base font-extrabold text-slate-900">{formatETB(b.total)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition min-h-[44px] flex items-center"
                      >
                        Receipt & Actions →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
