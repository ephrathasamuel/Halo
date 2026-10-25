'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatTime, formatETB } from '@/lib/format';
import { respondToQuote, advanceEvent } from '@/lib/domain/events';
import { openDispute } from '@/lib/domain/disputes';

const PIPELINE_STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'Shooting' },
  { key: 'completed', label: 'Post-Production' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'reviewed', label: 'Reviewed' },
];

export default function EventDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { session, isSignedIn } = useSession();

  const { data: events, refresh: refreshEvents } = useStorageSync(STORAGE_KEYS.EVENT_REQUESTS, []);
  const { data: quotes, refresh: refreshQuotes } = useStorageSync(STORAGE_KEYS.QUOTES, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);

  const eventReq = events.find((e) => e.id === id);
  const provider = providers.find((p) => p.id === eventReq?.providerId);
  const eventQuotes = quotes.filter((q) => q.requestId === id);
  const activeQuote = eventQuotes.find((q) => q.status === 'sent') || eventQuotes[0];

  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Production quality');
  const [disputeDesc, setDisputeDesc] = useState('');

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Please sign in to view this event</h1>
        <Link href={`/signin?next=/events/${id}`} className="px-4 py-2 bg-halo-primary text-white rounded-xl">
          Sign In
        </Link>
      </div>
    );
  }

  if (!eventReq) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Event Inquiry Not Found</h1>
        <Link href="/events" className="text-sm font-semibold text-halo-primary hover:underline">
          Return to event inquiries
        </Link>
      </div>
    );
  }

  // Ownership Guard
  const isRenter = eventReq.renterId === session.userId;
  const isOwner = eventReq.ownerId === session.userId;
  const isAdmin = session.roles?.includes('admin');

  if (!isRenter && !isOwner && !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
          <h2 className="text-lg font-black text-red-700">Access Denied</h2>
          <p className="text-xs text-red-600 mt-1">
            You are not authorized to view this event inquiry.
          </p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const isQuoteExpired = activeQuote && activeQuote.validUntil < todayStr;

  const handleQuoteResponse = (decision) => {
    setFeedback({ type: '', text: '' });
    if (!activeQuote) return;

    const res = respondToQuote(activeQuote.id, decision);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to update quote response' });
      return;
    }

    setFeedback({
      type: 'success',
      text: decision === 'accept' ? 'Quote accepted! You can now confirm and schedule the date.' : 'Quote declined.',
    });
    refreshEvents();
    refreshQuotes();
  };

  const handleConfirmEvent = () => {
    setFeedback({ type: '', text: '' });
    const res = advanceEvent(eventReq.id, 'confirmed');
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to confirm event' });
      return;
    }
    setFeedback({ type: 'success', text: 'Coverage confirmed! Production dates are now locked in.' });
    refreshEvents();
  };

  const handleOpenDispute = (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    const res = openDispute({
      targetType: 'event',
      targetId: eventReq.id,
      reason: disputeReason,
      description: disputeDesc,
    });
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to open dispute' });
      return;
    }
    setFeedback({ type: 'success', text: 'Dispute submitted. An administrator will review your case.' });
    setDisputeOpen(false);
    refreshEvents();
  };

  const currentStepIndex = PIPELINE_STEPS.findIndex((s) => s.key === eventReq.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {eventReq.eventType} Filming Production
            </h1>
            <span className="text-xs font-mono text-slate-400">#{eventReq.id.slice(0, 8)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Handled by <span className="font-bold text-slate-800">{provider?.name}</span> ({provider?.neighbourhood})
          </p>
        </div>

        <Link
          href="/events"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 min-h-[44px] flex items-center"
        >
          ← Back to All Inquiries
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

      {/* Production Lifecycle Progress Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Production Stage</p>
        <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="flex-1 min-w-[70px] text-center space-y-1">
                <div
                  className={`h-2 rounded-full transition ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-halo-primary ring-2 ring-halo-primary/30'
                      : 'bg-slate-100'
                  }`}
                />
                <p
                  className={`text-[10px] font-bold ${
                    isCurrent ? 'text-halo-primary' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Quote Card */}
      {activeQuote && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Official Quote (Version {activeQuote.version})
                </span>
                {isQuoteExpired ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/50">
                    EXPIRED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/50">
                    VALID UNTIL {formatDate(activeQuote.validUntil)}
                  </span>
                )}
              </div>
              <p className="text-3xl font-black mt-2 text-white">
                {formatETB(activeQuote.amount)}
              </p>
            </div>

            {/* Quote Action Buttons (Renter Only) */}
            {isRenter && eventReq.status === 'quoted' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuoteResponse('accept')}
                  disabled={isQuoteExpired}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs transition shadow-lg min-h-[44px]"
                >
                  ✓ Accept Quote
                </button>
                <button
                  onClick={() => handleQuoteResponse('decline')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition min-h-[44px]"
                >
                  Decline
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Package Inclusions:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-indigo-100">
              {activeQuote.inclusions.map((inc, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {inc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Confirmation Step if Accepted */}
      {isRenter && eventReq.status === 'accepted' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-emerald-900 text-sm">Quote Accepted!</h3>
            <p className="text-xs text-emerald-700">
              Confirm this event booking with mock platform deposit to lock your production date.
            </p>
          </div>
          <button
            onClick={handleConfirmEvent}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition min-h-[44px]"
          >
            Confirm & Schedule Production →
          </button>
        </div>
      )}

      {/* Event Details Specifications */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Event Specifications</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Event Date & Time</p>
            <p className="font-bold text-slate-900">📅 {formatDate(eventReq.date)}</p>
            <p className="text-xs text-slate-500">
              ⏰ {formatTime(eventReq.startTime)} ({eventReq.durationHours} hours estimated)
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Venue Location</p>
            <p className="font-bold text-slate-900">📍 {eventReq.location}</p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Coverage Scope</p>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {eventReq.coverage}
            </p>
          </div>

          {eventReq.notes && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Notes</p>
              <p className="text-xs text-slate-600">{eventReq.notes}</p>
            </div>
          )}
        </div>

        {/* Dispute Action */}
        {['confirmed', 'in_progress', 'completed', 'delivered'].includes(eventReq.status) && (
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Need support with footage delivery or crew fulfillment?</p>
            <button
              onClick={() => setDisputeOpen(!disputeOpen)}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 min-h-[44px] flex items-center"
            >
              Open Dispute on Production
            </button>
          </div>
        )}
      </div>

      {/* Dispute Modal Form */}
      {disputeOpen && (
        <form onSubmit={handleOpenDispute} className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-black text-rose-900 text-sm">Open Dispute for Review</h3>
          <p className="text-xs text-rose-700">
            Platform administrators will inspect this production inquiry and mediate between parties.
          </p>

          <div className="space-y-2">
            <label htmlFor="dispute-reason" className="block text-xs font-bold uppercase tracking-wider text-rose-800">
              Reason *
            </label>
            <select
              id="dispute-reason"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-300 bg-white text-sm min-h-[44px]"
            >
              <option value="Production quality">Production quality issue</option>
              <option value="Footage delivery delay">Footage delivery delay</option>
              <option value="Scope disagreement">Scope disagreement</option>
              <option value="Cancellation conflict">Cancellation conflict</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="dispute-desc" className="block text-xs font-bold uppercase tracking-wider text-rose-800">
              Detailed Description *
            </label>
            <textarea
              id="dispute-desc"
              rows={3}
              required
              value={disputeDesc}
              onChange={(e) => setDisputeDesc(e.target.value)}
              placeholder="Describe the discrepancy..."
              className="w-full px-4 py-2.5 rounded-xl border border-rose-300 bg-white text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDisputeOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-white min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow min-h-[44px]"
            >
              Submit Dispute
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
