'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatETB } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';

const STATUS_COLORS = {
  submitted: 'bg-amber-100 text-amber-800 border-amber-300',
  under_review: 'bg-blue-100 text-blue-800 border-blue-300',
  quoted: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  accepted: 'bg-teal-100 text-teal-800 border-teal-300',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  in_progress: 'bg-sky-100 text-sky-800 border-sky-300',
  completed: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-pink-100 text-pink-800 border-pink-300',
  reviewed: 'bg-slate-100 text-slate-800 border-slate-300',
  declined: 'bg-rose-100 text-rose-800 border-rose-300',
  expired: 'bg-gray-100 text-gray-700 border-gray-300',
  disputed: 'bg-rose-100 text-rose-800 border-rose-300',
};

export default function OwnerRequestsPage() {
  const { session } = useSession();
  const { data: eventRequests } = useStorageSync(STORAGE_KEYS.EVENT_REQUESTS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);
  const { data: quotes } = useStorageSync(STORAGE_KEYS.QUOTES, []);

  const myRequests = eventRequests.filter((e) => e.ownerId === session?.userId);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter === 'all'
    ? myRequests
    : myRequests.filter((e) => e.status === statusFilter);

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Event Filming Inquiries & Quotes</h1>
          <p className="text-xs text-slate-500 mt-1">
            Compose and revise custom quotes for weddings, celebrations, and corporate events.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: `All Inquiries (${myRequests.length})` },
          { id: 'submitted', label: `New Inquiries (${myRequests.filter((e) => e.status === 'submitted').length})` },
          { id: 'quoted', label: `Quoted (${myRequests.filter((e) => e.status === 'quoted').length})` },
          { id: 'confirmed', label: `Confirmed (${myRequests.filter((e) => ['confirmed', 'in_progress'].includes(e.status)).length})` },
          { id: 'delivered', label: `Delivered (${myRequests.filter((e) => ['completed', 'delivered', 'reviewed'].includes(e.status)).length})` },
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

      {/* Requests Directory */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No event inquiries match this filter"
          message="Inquiries sent from your public storefront will appear here."
          icon="📬"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((req) => {
            const renter = userMap.get(req.renterId);
            const reqQuotes = quotes.filter((q) => q.requestId === req.id);
            const latestQuote = reqQuotes[reqQuotes.length - 1];

            return (
              <div
                key={req.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        STATUS_COLORS[req.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-xs text-slate-400">#{req.id.slice(0, 8)}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {req.eventType} Coverage — {renter?.name || 'Client'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📅 {formatDate(req.date)} • 📍 {req.location} • ⏱ {req.durationHours}h estimated
                    </p>
                    <p className="text-xs text-slate-500">
                      📞 {renter?.phone || 'No phone'} • ✉️ {renter?.email}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {req.coverage}
                  </p>

                  {req.budgetHint && (
                    <p className="text-xs text-slate-500">
                      Client Budget Guide: <span className="font-bold text-slate-800">{formatETB(req.budgetHint)}</span>
                    </p>
                  )}

                  {latestQuote && (
                    <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
                      <div>
                        <span className="font-bold">Sent Quote v{latestQuote.version}:</span>
                        <p className="text-[11px] text-indigo-700">Valid until {formatDate(latestQuote.validUntil)}</p>
                      </div>
                      <span className="text-base font-black text-indigo-950">
                        {formatETB(latestQuote.amount)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Received {formatDate(req.createdAt?.slice(0, 10))}
                  </span>

                  <Link
                    href={`/owner/requests/${req.id}`}
                    className="px-4 py-2 bg-halo-primary text-white rounded-xl text-xs font-bold hover:bg-halo-primary-light transition min-h-[44px] flex items-center"
                  >
                    Compose / Manage Quote →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
