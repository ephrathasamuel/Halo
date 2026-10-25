'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useScopedStorage } from '@/hooks/useAdminScope';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { resolveDispute } from '@/lib/domain/disputes';
import { BackButton } from '@/components/ui/BackButton';

export default function AdminDisputeDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { data: disputes, refresh } = useScopedStorage(STORAGE_KEYS.DISPUTES);
  const { data: users } = useScopedStorage(STORAGE_KEYS.USERS);
  const { data: bookings } = useScopedStorage(STORAGE_KEYS.BOOKINGS);

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
        <h1 className="text-xl font-semibold text-halo-ink">Dispute Not Found</h1>
        <BackButton fallback="/admin/disputes" />
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
      <div className="flex items-center justify-between pb-4 border-b border-halo-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-halo-ink">
              Dispute Investigation #{dispute.id.slice(-6)}
            </h1>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                dispute.status === 'resolved'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {dispute.status}
            </span>
          </div>
          <p className="text-xs text-halo-text-muted mt-1">
            Opened on {formatDate(dispute.createdAt?.slice(0, 10))} by {opener?.name || 'User'} ({opener?.email})
          </p>
        </div>

        <BackButton fallback="/admin/disputes" />
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

      {/* Target & Claim Summary */}
      <div className="bg-white rounded-2xl border border-halo-border p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-halo-border">
          <div>
            <span className="text-halo-text-muted block">Target Asset:</span>
            <span className="font-semibold text-halo-ink">
              {dispute.targetType} #{dispute.targetId.slice(0, 8)}
            </span>
          </div>
          <div>
            <span className="text-halo-text-muted block">Claim Category:</span>
            <span className="font-semibold text-halo-ink">{dispute.reason}</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-halo-text-muted">Statement of Complaint</span>
          <p className="text-sm text-halo-ink bg-stone-50 p-4 rounded-2xl border border-halo-border leading-relaxed">
            &quot;{dispute.description}&quot;
          </p>
        </div>

        {relatedBooking && (
          <div className="p-4 rounded-2xl bg-stone-50 border border-halo-border text-xs space-y-1">
            <span className="font-semibold text-halo-ink block">Related Booking Context:</span>
            <p className="text-stone-600">
              Date: {formatDate(relatedBooking.date)}, Time: {relatedBooking.startTime} to {relatedBooking.endTime}, Total: ETB {relatedBooking.total}
            </p>
            <Link
              href={`/bookings/${relatedBooking.id}`}
              className="text-halo-ink font-semibold hover:underline inline-block pt-1"
            >
              Inspect Booking Receipt</Link>
          </div>
        )}
      </div>

      {/* Resolution Panel */}
      {dispute.status === 'resolved' ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3 text-xs text-emerald-950">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-emerald-800">Official Administrator Resolution</span>
            <span className="text-emerald-700">Resolved {formatDate(dispute.resolvedAt?.slice(0, 10))}</span>
          </div>
          <p className="text-sm leading-relaxed">&quot;{dispute.resolutionNotes}&quot;</p>
        </div>
      ) : (
        <form onSubmit={handleResolve} className="bg-white rounded-2xl border border-halo-border p-6 md:p-8 space-y-4">
          <h2 className="text-lg font-semibold text-halo-ink">Mediate & Resolve Dispute</h2>
          <p className="text-xs text-halo-text-muted">
            Submit formal findings and binding resolution instructions. This marks the dispute resolved and updates the target record state.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-xs font-semibold text-stone-700">
              Resolution Findings & Action Plan *
            </label>
            <textarea
              id="notes"
              rows={4}
              required
              placeholder="e.g. Reviewed equipment logs. Provider instructed to refund 50% deposit for defective light panel..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-halo-ink hover:bg-halo-ink-soft text-white font-semibold rounded-xl text-xs transition disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
