'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatMoney, formatDate, formatTime } from '@/lib/format';
import { transitionBooking } from '@/lib/domain/bookings';
import { EmptyState } from '@/components/states/EmptyState';
import { STATUS_TONES, statusLabel } from '@/lib/status';
import { currencyOfProvider, currencyOfCurrentOwner } from '@/lib/domain/providers';

const STATUS_BADGES = STATUS_TONES;

export default function OwnerBookingsPage() {
  const { session } = useSession();
  const { data: bookings, refresh } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);

  const myBookings = bookings.filter((b) => b.ownerId === session?.userId);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const filtered = statusFilter === 'all'
    ? myBookings
    : myBookings.filter((b) => b.status === statusFilter);

  // Sort newest first
  filtered.sort((a, b) => new Date(b.date + 'T' + b.startTime) - new Date(a.date + 'T' + a.startTime));

  const handleTransition = (bookingId, targetState) => {
    setFeedback({ type: '', text: '' });
    const res = transitionBooking(bookingId, targetState);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || `Failed to transition booking to ${targetState}` });
      return;
    }
    setFeedback({
      type: 'success',
      text: `Booking #${bookingId.slice(0, 8)} status updated to ${targetState.replace('_', ' ')}!`,
    });
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-halo-border">
        <div>
          <h1 className="text-2xl font-semibold text-halo-ink">Booking Pipeline & Fulfillment</h1>
          <p className="text-xs text-halo-text-muted mt-1">
            Accept requests, initiate active sessions, and mark completed bookings.
          </p>
        </div>

        <Link
          href="/owner/calendar"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-halo-border-strong rounded-xl text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 transition min-h-[44px]"
        >
          Open Calendar View
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

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-halo-border pb-2 overflow-x-auto">
        {[
          { id: 'all', label: `All (${myBookings.length})` },
          { id: 'requested', label: `Requested (${myBookings.filter((b) => b.status === 'requested').length})` },
          { id: 'confirmed', label: `Confirmed (${myBookings.filter((b) => b.status === 'confirmed').length})` },
          { id: 'in_progress', label: `In Progress (${myBookings.filter((b) => b.status === 'in_progress').length})` },
          { id: 'completed', label: `Completed (${myBookings.filter((b) => ['completed', 'reviewed'].includes(b.status)).length})` },
          { id: 'cancelled', label: `Cancelled / Declined (${myBookings.filter((b) => ['cancelled', 'declined'].includes(b.status)).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap min-h-[44px] ${
              statusFilter === tab.id
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No bookings match this filter"
          message="Bookings from renters will appear here as they are submitted."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const renter = userMap.get(b.renterId);
            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-halo-border p-6 hover:border-halo-border-strong transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-halo-border">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                        STATUS_BADGES[b.status] || 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {statusLabel(b.status)}
                    </span>
                    <span className="font-mono text-xs text-halo-text-muted">#{b.id.slice(-6)}</span>
                    <span className="text-xs text-halo-text-muted">Created on {formatDate(b.createdAt?.slice(0, 10))}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-halo-text-muted">Owner Net Earnings: </span>
                    <span className="text-base font-semibold text-halo-ink">
                      {formatMoney((b.subtotal || 0) - (b.fee || 0), currencyOfProvider(b.providerId))}
                    </span>
                    <span className="text-xs text-halo-text-muted ml-1">(Subtotal: {formatMoney(b.subtotal, currencyOfProvider(b.providerId))})</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Shoot Time & Date */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-halo-text-muted">Scheduled Time Window</p>
                    <p className="text-sm font-semibold text-halo-ink">{formatDate(b.date)}</p>
                    <p className="text-xs text-stone-600">
                      {formatTime(b.startTime)} to {formatTime(b.endTime)} ({b.hours} hours total)
                    </p>
                    <p className="text-[11px] text-halo-text-muted">
                      Payment Status: <span className="font-semibold text-stone-700">{b.paymentStatus}</span>
                    </p>
                  </div>

                  {/* Renter Contact */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-halo-text-muted">Renter Information</p>
                    <p className="text-sm font-semibold text-halo-ink">{renter?.name || 'Unknown Renter'}</p>
                    <p className="text-xs text-stone-600">{renter?.phone || 'No phone provided'}</p>
                    <p className="text-xs text-halo-text-muted">{renter?.email}</p>
                  </div>

                  {/* Booked Inventory */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-halo-text-muted">Booked Items</p>
                    <div className="space-y-0.5 text-xs text-stone-700">
                      {b.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.qty}x {item.type}</span>
                          <span className="font-semibold">{formatMoney(item.lineTotal, currencyOfCurrentOwner())}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* State Machine Action Controls */}
                <div className="pt-4 border-t border-halo-border flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-halo-text-muted">
                    {b.status === 'requested' && 'Awaiting your approval. Confirming will verify room availability.'}
                    {b.status === 'confirmed' && 'Confirmed booking. Start shoot session when the renter arrives.'}
                    {b.status === 'in_progress' && 'Shoot in progress. Mark complete when session finishes.'}
                    {b.status === 'completed' && 'Session completed. Renter has been invited to leave a review.'}
                  </div>

                  <div className="flex items-center gap-2">
                    {b.status === 'requested' && (
                      <>
                        <button
                          onClick={() => handleTransition(b.id, 'confirmed')}
                          className="px-4 py-2 bg-halo-ink hover:bg-halo-ink-soft text-white rounded-xl text-xs font-semibold transition min-h-[44px]"
                        >Confirm Booking
                        </button>
                        <button
                          onClick={() => handleTransition(b.id, 'declined')}
                          className="px-4 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition min-h-[44px]"
                        >Decline
                        </button>
                      </>
                    )}

                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleTransition(b.id, 'in_progress')}
                        className="px-4 py-2 bg-halo-ink hover:bg-halo-ink-soft text-white rounded-xl text-xs font-semibold transition min-h-[44px]"
                      >Start Shoot Session
                      </button>
                    )}

                    {b.status === 'in_progress' && (
                      <button
                        onClick={() => handleTransition(b.id, 'completed')}
                        className="px-4 py-2 bg-halo-ink hover:bg-halo-ink-soft text-white rounded-xl text-xs font-semibold transition min-h-[44px]"
                      >Mark Shoot Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
