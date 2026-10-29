'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMyStorefront } from '@/hooks/useMyStorefront';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatMoney } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';
import { STATUS_TONES, statusLabel } from '@/lib/status';
import { currencyOfProvider } from '@/lib/domain/providers';

const STATUS_COLORS = STATUS_TONES;

export default function OwnerRequestsPage() {
  const { provider: storefront } = useMyStorefront();
  const { data: eventRequests } = useStorageSync(STORAGE_KEYS.EVENT_REQUESTS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);
  const { data: quotes } = useStorageSync(STORAGE_KEYS.QUOTES, []);

  const myRequests = eventRequests.filter((e) => e.providerId === storefront?.id);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-halo-border">
        <div>
          <h1 className="text-2xl font-semibold text-halo-ink">Event Filming Inquiries & Quotes</h1>
          <p className="text-xs text-halo-text-muted mt-1">
            Compose and revise custom quotes for weddings, celebrations, and corporate events.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-halo-border pb-2 overflow-x-auto">
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

      {/* Requests Directory */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No event inquiries match this filter"
          message="Inquiries sent from your public storefront will appear here."
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
                className="bg-white rounded-2xl border border-halo-border p-6 hover:border-halo-border-strong transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        STATUS_COLORS[req.status] || 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {statusLabel(req.status)}
                    </span>
                    <span className="font-mono text-xs text-halo-text-muted">#{req.id.slice(-6)}</span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-halo-ink text-lg">
                      {req.eventType} Coverage, {renter?.name || 'Client'}
                    </h3>
                    <p className="text-xs text-halo-text-muted mt-0.5">
                      {formatDate(req.date)}, {req.location}, {req.durationHours}h estimated
                    </p>
                    <p className="text-xs text-halo-text-muted">
                      {renter?.phone || 'No phone'}, {renter?.email}
                    </p>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 bg-stone-50 p-3 rounded-xl border border-halo-border">
                    {req.coverage}
                  </p>

                  {req.budgetHint && (
                    <p className="text-xs text-halo-text-muted">
                      Client Budget Guide: <span className="font-semibold text-halo-ink">{formatMoney(req.budgetHint, currencyOfProvider(req.providerId))}</span>
                    </p>
                  )}

                  {latestQuote && (
                    <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
                      <div>
                        <span className="font-semibold">Sent Quote v{latestQuote.version}:</span>
                        <p className="text-[11px] text-indigo-700">Valid until {formatDate(latestQuote.validUntil)}</p>
                      </div>
                      <span className="text-base font-semibold text-indigo-950">
                        {formatMoney(latestQuote.amount, currencyOfProvider(req.providerId))}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-halo-border flex items-center justify-between">
                  <span className="text-xs text-halo-text-muted">
                    Received {formatDate(req.createdAt?.slice(0, 10))}
                  </span>

                  <Link
                    href={`/owner/requests/${req.id}`}
                    className="px-4 py-2 bg-halo-ink text-white rounded-xl text-xs font-semibold hover:bg-halo-ink-soft transition min-h-[44px] flex items-center"
                  >
                    Compose / Manage Quote</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
