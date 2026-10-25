'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { resolveDispute } from '@/lib/domain/disputes';

export default function AdminDisputeDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { data: disputes, refresh } = useStorageSync(STORAGE_KEYS.DISPUTES, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);

  const dispute = disputes.find((d) => d.id === id);
  const opener = users.find((u) => u.id === dispute?.openedBy);
  const relatedBooking = dispute?.targetType === 'booking'
    ? bookings.find((b) => b.id === dispute.targetId)
    : null;

  const [resolutionNotes, setResolutionNotes] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!dispute) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Dispute Not Found</h1>
        <Link href="/admin/disputes" className="text-xs font-bold text-halo-primary hover:underline">
          Return to disputes
        </Link>
      </div>
    );
  }

  const handleResolve = (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setIsSubmitting(true);

    const res = resolveDispute(dispute.id, resolutionNotes);
    setIsSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to resolve dispute' });
      return;
    }

    setFeedback({ type: 'success', text: 'Dispute has been officially resolved!' });
    refresh();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Dispute Investigation #{dispute.id.slice(0, 8)}
            </h1>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                dispute.status === 'resolved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {dispute.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Opened on {formatDate(dispute.createdAt?.slice(0, 10))} by {opener?.name || 'User'} ({opener?.email})
          </p>
        </div>

        <Link
          href="/admin/disputes"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 min-h-[44px] flex items-center"
        >
          ← Back to Disputes
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

      {/* Target & Claim Summary */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-slate-100">
          <div>
            <span className="text-slate-400 block">Target Asset:</span>
            <span className="font-bold text-slate-900 uppercase">
              {dispute.targetType} #{dispute.targetId.slice(0, 8)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Claim Category:</span>
            <span className="font-bold text-slate-900">{dispute.reason}</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Statement of Complaint</span>
          <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
            &quot;{dispute.description}&quot;
          </p>
        </div>

        {relatedBooking && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-900 block">Related Booking Context:</span>
            <p className="text-slate-600">
              Date: {formatDate(relatedBooking.date)} • Time: {relatedBooking.startTime} — {relatedBooking.endTime} • Total: ETB {relatedBooking.total}
            </p>
            <Link
              href={`/bookings/${relatedBooking.id}`}
              className="text-halo-primary font-bold hover:underline inline-block pt-1"
            >
              Inspect Booking Receipt →
            </Link>
          </div>
        )}
      </div>

      {/* Resolution Panel */}
      {dispute.status === 'resolved' ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm space-y-3 text-xs text-emerald-950">
          <div className="flex items-center justify-between">
            <span className="font-black text-sm uppercase text-emerald-800">✓ Official Administrator Resolution</span>
            <span className="text-emerald-700">Resolved {formatDate(dispute.resolvedAt?.slice(0, 10))}</span>
          </div>
          <p className="text-sm leading-relaxed">&quot;{dispute.resolutionNotes}&quot;</p>
        </div>
      ) : (
        <form onSubmit={handleResolve} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Mediate & Resolve Dispute</h2>
          <p className="text-xs text-slate-500">
            Submit formal findings and binding resolution instructions. This marks the dispute resolved and updates the target record state.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Resolution Findings & Action Plan *
            </label>
            <textarea
              id="notes"
              rows={4}
              required
              placeholder="e.g. Reviewed equipment logs. Provider instructed to refund 50% deposit for defective light panel..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
