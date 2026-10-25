'use client';

import { use, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatMoney } from '@/lib/format';
import { sendQuote, advanceEvent } from '@/lib/domain/events';
import { statusLabel } from '@/lib/status';
import { currencyOfProvider } from '@/lib/domain/providers';
import { BackButton } from '@/components/ui/BackButton';

const QUICK_INCLUSIONS = [
  'Full day coverage',
  '2 videographers',
  '3 camera angles',
  'Drone aerial footage',
  'Same-day highlight reel',
  'Cinematic feature film (10-15 mins)',
  'Complete ceremony edit',
  'Unedited RAW footage delivery',
  'Professional audio master',
  'Fast 2-week turnaround',
];

export default function OwnerRequestComposerPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { session } = useSession();

  const { data: eventRequests, refresh: refreshRequests } = useStorageSync(STORAGE_KEYS.EVENT_REQUESTS, []);
  const { data: quotes, refresh: refreshQuotes } = useStorageSync(STORAGE_KEYS.QUOTES, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);

  const req = eventRequests.find((r) => r.id === id);
  const reqQuotes = quotes.filter((q) => q.requestId === id);
  const renter = users.find((u) => u.id === req?.renterId);

  // Form State
  const defaultValidUntil = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  };

  const [quoteAmount, setQuoteAmount] = useState(req?.budgetHint || 20000);
  const [selectedInclusions, setSelectedInclusions] = useState([
    'Full day coverage',
    '2 videographers',
    'Same-day highlight reel',
  ]);
  const [validUntil, setValidUntil] = useState(defaultValidUntil());
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!req) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h1 className="text-xl font-semibold text-halo-ink">Inquiry Not Found</h1>
        <BackButton fallback="/owner/requests" />
      </div>
    );
  }

  // Ownership Guard
  const isAdmin = session?.roles?.includes('admin');
  if (req.ownerId !== session?.userId && !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
          <h2 className="text-lg font-semibold text-red-700">Access Denied</h2>
          <p className="text-xs text-red-600 mt-1">
            Not yours: You do not own the provider handling this inquiry.
          </p>
        </div>
      </div>
    );
  }

  const toggleInclusion = (inc) => {
    setSelectedInclusions((prev) =>
      prev.includes(inc) ? prev.filter((i) => i !== inc) : [...prev, inc]
    );
  };

  const handleSendQuote = (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setIsSubmitting(true);

    const res = sendQuote(req.id, {
      amount: Number(quoteAmount),
      inclusions: selectedInclusions,
      validUntil,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to send quote' });
      return;
    }

    setFeedback({
      type: 'success',
      text: `Quote Version ${res.data.version} for ${formatMoney(res.data.amount, currencyOfProvider(req.providerId))} has been dispatched to client!`,
    });
    refreshRequests();
    refreshQuotes();
  };

  const handleAdvanceStage = (nextStage) => {
    setFeedback({ type: '', text: '' });
    const res = advanceEvent(req.id, nextStage);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || `Failed to advance to ${nextStage}` });
      return;
    }
    setFeedback({
      type: 'success',
      text: `Production advanced to: ${nextStage.replace('_', ' ').toUpperCase()}!`,
    });
    refreshRequests();
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-halo-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-halo-ink">
              {req.eventType} Production Quote
            </h1>
            <span className="text-xs font-mono text-halo-text-muted">#{req.id.slice(-6)}</span>
          </div>
          <p className="text-xs text-halo-text-muted mt-1">
            Client: <span className="font-semibold text-halo-ink">{renter?.name}</span> ({renter?.phone || 'No phone'}), {renter?.email}
          </p>
        </div>

        <BackButton fallback="/owner/requests" />
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

      {/* Production Lifecycle Action Toolbar */}
      <div className="bg-white rounded-2xl border border-halo-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-halo-text-muted">Current Production Status</span>
          <p className="text-lg font-semibold text-halo-ink capitalize mt-0.5">
            {statusLabel(req.status)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {req.status === 'accepted' && (
            <button
              onClick={() => handleAdvanceStage('confirmed')}
              className="px-4 py-2 bg-halo-ink hover:bg-halo-ink-soft text-white font-semibold rounded-xl text-xs transition min-h-[44px]"
            >Confirm Production Date
            </button>
          )}

          {req.status === 'confirmed' && (
            <button
              onClick={() => handleAdvanceStage('in_progress')}
              className="px-4 py-2 bg-halo-ink hover:bg-halo-ink-soft text-white font-semibold rounded-xl text-xs transition min-h-[44px]"
            >Start Production / Shooting
            </button>
          )}

          {req.status === 'in_progress' && (
            <button
              onClick={() => handleAdvanceStage('completed')}
              className="px-4 py-2 bg-halo-ink hover:bg-halo-ink-soft text-white font-semibold rounded-xl text-xs transition min-h-[44px]"
            >Finish Shooting & Enter Post
            </button>
          )}

          {req.status === 'completed' && (
            <button
              onClick={() => handleAdvanceStage('delivered')}
              className="px-4 py-2 bg-halo-ink hover:bg-halo-ink-soft text-white font-semibold rounded-xl text-xs transition min-h-[44px]"
            >
              Deliver Final Master Footage
            </button>
          )}
        </div>
      </div>

      {/* Quote Composer Form (Available while not yet delivered or completed) */}
      {!['completed', 'delivered', 'reviewed'].includes(req.status) && (
        <form onSubmit={handleSendQuote} className="bg-white rounded-2xl border border-halo-border p-6 md:p-8 space-y-6">
          <div className="border-b border-halo-border pb-4">
            <h2 className="text-lg font-semibold text-halo-ink">
              {reqQuotes.length > 0 ? `Compose Revised Quote (Version ${reqQuotes.length + 1})` : 'Compose Initial Quote'}
            </h2>
            <p className="text-xs text-halo-text-muted mt-0.5">
              Specify pricing, valid duration, and exact deliverables. Sending a revised quote automatically supersedes previous versions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="quote-amount" className="block text-xs font-semibold text-stone-700">
                Total Production Fee (ETB) *
              </label>
              <input
                id="quote-amount"
                type="number"
                min="1000"
                step="500"
                required
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="valid-until" className="block text-xs font-semibold text-stone-700">
                Quote Valid Until *
              </label>
              <input
                id="valid-until"
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
              />
            </div>
          </div>

          {/* Inclusions Preset Chips */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-stone-700">
              Deliverables & Inclusions ({selectedInclusions.length} selected):
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_INCLUSIONS.map((inc) => {
                const active = selectedInclusions.includes(inc);
                return (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => toggleInclusion(inc)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition min-h-[44px] ${
                      active
                      ? 'bg-halo-ink text-white border-halo-primary'
                      : 'bg-stone-50 text-stone-600 border-halo-border hover:bg-stone-100'
                    }`}
                  >
                    {active ? '' : '+ '} {inc}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-halo-border flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-halo-ink text-white font-semibold rounded-xl hover:bg-halo-ink-soft transition disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? 'Dispatching...' : reqQuotes.length > 0 ? 'Send Revised Quote' : 'Dispatch Quote to Client'}
            </button>
          </div>
        </form>
      )}

      {/* Previous Quotes History */}
      {reqQuotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-halo-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-halo-ink">Quote Version History</h2>
          <div className="divide-y divide-halo-border">
            {reqQuotes.map((q) => (
              <div key={q.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-halo-ink">Version {q.version}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        q.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : q.status === 'sent'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-stone-100 text-stone-600 border-halo-border'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <p className="text-xs text-halo-text-muted">
                    Valid until: {formatDate(q.validUntil)}
                  </p>
                  <div className="text-xs text-stone-600 flex flex-wrap gap-2 pt-1">
                    {q.inclusions.map((inc, i) => (
                      <span key={i} className="bg-stone-50 px-2 py-0.5 rounded border border-halo-border">
                       {inc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-halo-text-muted">Quoted Amount</p>
                  <p className="text-lg font-semibold text-halo-ink">{formatMoney(q.amount, currencyOfProvider(req.providerId))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
