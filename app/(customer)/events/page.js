'use client';

import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatETB } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';

const EVENT_STATUS_COLORS = {
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

export default function CustomerEventsPage() {
  const { session, isSignedIn } = useSession();
  const { data: events } = useStorageSync(STORAGE_KEYS.EVENT_REQUESTS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: quotes } = useStorageSync(STORAGE_KEYS.QUOTES, []);

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to view your event inquiries</h1>
        <Link
          href="/signin?next=/events"
          className="inline-flex items-center px-6 py-3 bg-halo-primary text-white font-semibold rounded-xl hover:bg-halo-primary-light transition min-h-[44px]"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Event Filming Inquiries</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track custom production quotes, negotiate inclusions, and confirm event coverage.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-medium transition min-h-[44px] flex items-center"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {myEvents.length === 0 ? (
        <EmptyState
          title="No event inquiries submitted"
          message="Browse studios and request a quote for your wedding, engagement, or corporate production."
          icon="🎥"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myEvents.map((evt) => {
            const provider = providerMap.get(evt.providerId);
            const latestQuote = quoteMap.get(evt.id);

            return (
              <div
                key={evt.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        EVENT_STATUS_COLORS[evt.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {evt.status.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-xs text-slate-400">#{evt.id.slice(0, 8)}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {evt.eventType} — {provider ? provider.name : 'Production Crew'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📅 Date: {formatDate(evt.date)} • 📍 Venue: {evt.location}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {evt.coverage}
                  </p>

                  {latestQuote && (
                    <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
                      <div>
                        <span className="font-bold">Latest Quote (v{latestQuote.version}):</span>
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
                    Created {formatDate(evt.createdAt?.slice(0, 10))}
                  </span>

                  <Link
                    href={`/events/${evt.id}`}
                    className="px-4 py-2 bg-halo-primary text-white rounded-xl text-xs font-bold hover:bg-halo-primary-light transition min-h-[44px] flex items-center"
                  >
                    View Status & Quote →
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
