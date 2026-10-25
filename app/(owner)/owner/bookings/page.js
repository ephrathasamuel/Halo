'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatETB, formatDate, formatTime } from '@/lib/format';
import { transitionBooking } from '@/lib/domain/bookings';
import { EmptyState } from '@/components/states/EmptyState';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Booking Pipeline & Fulfillment</h1>
          <p className="text-xs text-slate-500 mt-1">
            Accept requests, initiate active sessions, and mark completed bookings.
          </p>
        </div>

        <Link
          href="/owner/calendar"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm min-h-[44px]"
        >
          <span>📅</span> Open Calendar View
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

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[44px] ${
              statusFilter === tab.id
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
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
          icon="📅"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const renter = userMap.get(b.renterId);
            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        STATUS_BADGES[b.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-xs text-slate-400">#{b.id.slice(0, 8)}</span>
                    <span className="text-xs text-slate-400">• Created on {formatDate(b.createdAt?.slice(0, 10))}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400">Owner Net Earnings: </span>
                    <span className="text-base font-black text-slate-900">
                      {formatETB((b.subtotal || 0) - (b.fee || 0))}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">(Subtotal: {formatETB(b.subtotal)})</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Shoot Time & Date */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Time Window</p>
                    <p className="text-sm font-bold text-slate-900">📅 {formatDate(b.date)}</p>
                    <p className="text-xs text-slate-600">
                      ⏰ {formatTime(b.startTime)} — {formatTime(b.endTime)} ({b.hours} hours total)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Payment Status: <span className="font-semibold text-slate-700">{b.paymentStatus}</span>
                    </p>
                  </div>

                  {/* Renter Contact */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Renter Information</p>
                    <p className="text-sm font-bold text-slate-900">{renter?.name || 'Unknown Renter'}</p>
                    <p className="text-xs text-slate-600">📞 {renter?.phone || 'No phone provided'}</p>
                    <p className="text-xs text-slate-500">✉️ {renter?.email}</p>
                  </div>

                  {/* Booked Inventory */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Booked Items</p>
                    <div className="space-y-0.5 text-xs text-slate-700">
                      {b.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.qty}x {item.type}</span>
                          <span className="font-semibold">{formatETB(item.lineTotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* State Machine Action Controls */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    {b.status === 'requested' && '⚠️ Awaiting your approval. Confirming will verify room availability.'}
                    {b.status === 'confirmed' && '✓ Confirmed booking. Start shoot session when the renter arrives.'}
                    {b.status === 'in_progress' && '🎬 Shoot in progress. Mark complete when session finishes.'}
                    {b.status === 'completed' && '✓ Session completed. Renter has been invited to leave a review.'}
                  </div>

                  <div className="flex items-center gap-2">
                    {b.status === 'requested' && (
                      <>
                        <button
                          onClick={() => handleTransition(b.id, 'confirmed')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm min-h-[44px]"
                        >
                          ✓ Confirm Booking
                        </button>
                        <button
                          onClick={() => handleTransition(b.id, 'declined')}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition min-h-[44px]"
                        >
                          ✕ Decline
                        </button>
                      </>
                    )}

                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleTransition(b.id, 'in_progress')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm min-h-[44px]"
                      >
                        ▶ Start Shoot Session
                      </button>
                    )}

                    {b.status === 'in_progress' && (
                      <button
                        onClick={() => handleTransition(b.id, 'completed')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm min-h-[44px]"
                      >
                        ✓ Mark Shoot Completed
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
