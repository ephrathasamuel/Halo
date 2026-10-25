'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatETB, formatDate, formatTime } from '@/lib/format';
import { transitionBooking } from '@/lib/domain/bookings';

export default function OwnerOverviewPage() {
  const { session } = useSession();
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: listings } = useStorageSync(STORAGE_KEYS.LISTINGS, []);
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Find provider owned by this user
  const provider = providers.find((p) => p.ownerId === session?.userId);
  const myBookings = bookings.filter((b) => b.ownerId === session?.userId);
  const myListings = listings.filter((l) => l.ownerId === session?.userId);
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Metrics
  const pendingRequests = myBookings.filter((b) => b.status === 'requested');
  const activeBookings = myBookings.filter((b) => ['confirmed', 'in_progress'].includes(b.status));
  const activeListingsCount = myListings.filter((l) => l.status === 'approved').length;

  // Owner earnings = subtotal - platform fee (10%)
  const totalOwnerEarnings = myBookings
    .filter((b) => ['confirmed', 'in_progress', 'completed', 'reviewed'].includes(b.status))
    .reduce((sum, b) => {
      const ownerShare = (b.subtotal || 0) - (b.fee || 0);
      return sum + ownerShare;
    }, 0);

  const handleAction = (bookingId, targetState) => {
    setActionError('');
    setActionSuccess('');
    const res = transitionBooking(bookingId, targetState);
    if (!res.ok) {
      setActionError(res.error || `Failed to transition booking to ${targetState}`);
      return;
    }
    setActionSuccess(`Booking #${bookingId.slice(0, 8)} successfully transitioned to ${targetState}!`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  if (!provider) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">No Provider Storefront Found</h2>
        <p className="text-slate-500">
          Your account has the owner role, but no storefront record is linked to your user ID.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Profile Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner"
            style={{ backgroundColor: provider.brandColor || '#1E3A5F', color: '#ffffff' }}
          >
            {provider.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{provider.name}</h1>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  provider.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {provider.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              📍 {provider.neighbourhood}, {provider.city} • 🕐 {provider.hours.open} — {provider.hours.close}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/studios/${provider.slug}`}
            target="_blank"
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition min-h-[44px] flex items-center gap-1.5"
          >
            <span>🌐</span> Public Storefront ↗
          </Link>
          <Link
            href="/owner/listings/new"
            className="px-4 py-2 bg-halo-primary text-white rounded-xl text-xs font-bold hover:bg-halo-primary-light transition shadow min-h-[44px] flex items-center gap-1.5"
          >
            <span>➕</span> Add New Listing
          </Link>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between shadow-sm">
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError('')} className="text-xs font-bold text-red-600 hover:underline min-h-[44px] px-2">Dismiss</button>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center justify-between shadow-sm">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-xs font-bold text-emerald-700 hover:underline min-h-[44px] px-2">Dismiss</button>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Owner Earnings</p>
          <p className="text-2xl font-black text-slate-900">{formatETB(totalOwnerEarnings)}</p>
          <p className="text-[11px] text-slate-400">Subtotal minus 10% platform fee</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Requests</p>
          <p className="text-2xl font-black text-amber-700">{pendingRequests.length}</p>
          <p className="text-[11px] text-amber-600">Needs your review</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Active Shoots</p>
          <p className="text-2xl font-black text-blue-700">{activeBookings.length}</p>
          <p className="text-[11px] text-blue-600">Confirmed or in progress</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Listings</p>
          <p className="text-2xl font-black text-slate-900">{activeListingsCount} / {myListings.length}</p>
          <p className="text-[11px] text-slate-400">Published & bookable</p>
        </div>
      </div>

      {/* Pending Booking Requests Section */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Incoming Booking Requests</h2>
            <p className="text-xs text-slate-500">Review requests requiring your approval before confirming slots</p>
          </div>
          <Link
            href="/owner/bookings"
            className="text-xs font-bold text-halo-primary hover:underline min-h-[44px] flex items-center"
          >
            View All ({myBookings.length}) →
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            ✓ No pending booking requests at this time. All caught up!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingRequests.map((b) => {
              const renter = userMap.get(b.renterId);
              return (
                <div key={b.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {renter?.name || 'Renter'} ({renter?.phone || 'No phone'})
                      </span>
                      <span className="text-xs text-slate-400 font-mono">#{b.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      📅 {formatDate(b.date)} • ⏰ {formatTime(b.startTime)} — {formatTime(b.endTime)} ({b.hours} hours)
                    </p>
                    <div className="text-xs text-slate-500">
                      {b.items.map((i, idx) => (
                        <span key={idx} className="mr-2">
                          • {i.qty}x {i.type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Subtotal</p>
                      <p className="text-sm font-black text-slate-900">{formatETB(b.subtotal)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(b.id, 'confirmed')}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm min-h-[44px]"
                      >
                        ✓ Confirm Slot
                      </button>
                      <button
                        onClick={() => handleAction(b.id, 'declined')}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition min-h-[44px]"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/owner/calendar"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition space-y-2 group"
        >
          <span className="text-2xl group-hover:scale-110 transition inline-block">📅</span>
          <h3 className="font-bold text-slate-900">Studio & Gear Calendar</h3>
          <p className="text-xs text-slate-500">
            View booking timeline, buffer cleanup windows, and scheduled shoot sessions.
          </p>
        </Link>

        <Link
          href="/owner/portfolio"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition space-y-2 group"
        >
          <span className="text-2xl group-hover:scale-110 transition inline-block">🎨</span>
          <h3 className="font-bold text-slate-900">Portfolio & Gallery</h3>
          <p className="text-xs text-slate-500">
            Upload and organize showcase photographs, wedding films, and fashion editorials.
          </p>
        </Link>

        <Link
          href="/owner/earnings"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition space-y-2 group"
        >
          <span className="text-2xl group-hover:scale-110 transition inline-block">📊</span>
          <h3 className="font-bold text-slate-900">Earnings & Financials</h3>
          <p className="text-xs text-slate-500">
            Track revenue performance, breakdown by listing type, and export financial CSV.
          </p>
        </Link>
      </div>
    </div>
  );
}
