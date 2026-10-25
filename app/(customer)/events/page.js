'use client';

import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatMoney } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';
import { STATUS_TONES, statusLabel } from '@/lib/status';
import { currencyOfProvider } from '@/lib/domain/providers';
import { BackButton } from '@/components/ui/BackButton';

const EVENT_STATUS_COLORS = STATUS_TONES;

export default function CustomerEventsPage() {
  const { session, isSignedIn, isLoaded } = useSession();
  const { data: events } = useStorageSync(STORAGE_KEYS.EVENT_REQUESTS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: quotes } = useStorageSync(STORAGE_KEYS.QUOTES, []);

  // Wait for the stored session before showing the signed-out state
  if (!isLoaded) return <div className="min-h-[50vh]" aria-busy="true" />;

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-halo-ink">Sign in to view your event inquiries</h1>
        <Link
          href="/signin?next=/events"
          className="inline-flex items-center px-6 py-3 bg-halo-ink text-white font-semibold rounded-xl hover:bg-halo-ink-soft transition min-h-[44px]"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const myEvents = events.filter((e) => e.renterId === session.userId);
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  // Find latest quote per event
  const quoteMap = new Map();
  quotes.forEach((q) => {
    const existing = quoteMap.get(q.requestId);
    if (!existing || q.version > existing.version) {
      quoteMap.set(q.requestId, q);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-halo-border">
        <div>
          <h1 className="text-3xl font-semibold text-halo-ink">Event Filming Inquiries</h1>
          <p className="text-sm text-halo-text-muted mt-1">
            Track custom production quotes, negotiate inclusions, and confirm event coverage.
          </p>
        </div>

        <BackButton fallback="/dashboard" />
      </div>

      {myEvents.length === 0 ? (
        <EmptyState
          title="No event inquiries submitted"
          message="Browse studios and request a quote for your wedding, engagement, or corporate production."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myEvents.map((evt) => {
            const provider = providerMap.get(evt.providerId);
            const latestQuote = quoteMap.get(evt.id);

            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-halo-border p-6 hover:border-halo-border-strong transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        EVENT_STATUS_COLORS[evt.status] || 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {statusLabel(evt.status)}
                    </span>
                    <span className="font-mono text-xs text-halo-text-muted">#{evt.id.slice(-6)}</span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-halo-ink text-lg">
                      {evt.eventType} with {provider ? provider.name : 'Production Crew'}
                    </h3>
                    <p className="text-xs text-halo-text-muted mt-0.5">
                      Date: {formatDate(evt.date)}, Venue: {evt.location}
                    </p>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2">
                    {evt.coverage}
                  </p>

                  {latestQuote && (
                    <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
                      <div>
                        <span className="font-semibold">Latest Quote (v{latestQuote.version}):</span>
                        <p className="text-[11px] text-indigo-700">Valid until {formatDate(latestQuote.validUntil)}</p>
                      </div>
                      <span className="text-base font-semibold text-indigo-950">
                        {formatMoney(latestQuote.amount, currencyOfProvider(evt.providerId))}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-halo-border flex items-center justify-between">
                  <span className="text-xs text-halo-text-muted">
                    Created {formatDate(evt.createdAt?.slice(0, 10))}
                  </span>

                  <Link
                    href={`/events/${evt.id}`}
                    className="px-4 py-2 bg-halo-ink text-white rounded-xl text-xs font-semibold hover:bg-halo-ink-soft transition min-h-[44px] flex items-center"
                  >
                    View Status & Quote</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
