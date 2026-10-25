'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { replyToReview } from '@/lib/domain/reviews';
import { EmptyState } from '@/components/states/EmptyState';

export default function OwnerReviewsPage() {
  const { session } = useSession();
  const { data: reviews, refresh } = useStorageSync(STORAGE_KEYS.REVIEWS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);

  const myReviews = reviews.filter((r) => r.ownerId === session?.userId);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenReply = (reviewId) => {
    setActiveReplyId(reviewId);
    setReplyText('');
    setFeedback({ type: '', text: '' });
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setIsSubmitting(true);

    const res = replyToReview({
      reviewId: activeReplyId,
      ownerReply: replyText,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to submit reply' });
      return;
    }

    setFeedback({ type: 'success', text: 'Your owner response has been published!' });
    setActiveReplyId(null);
    refresh();
  };

  const avgRating = myReviews.length > 0
    ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Reviews & Feedback</h1>
          <p className="text-xs text-slate-500 mt-1">
            Read verified customer reviews and post one-time official provider responses.
          </p>
        </div>

        {myReviews.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-200">
            <span className="text-xl text-amber-500">★</span>
            <span className="text-base font-black text-amber-900">{avgRating} / 5.0</span>
            <span className="text-xs text-amber-700">({myReviews.length} reviews)</span>
          </div>
        )}
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

      {myReviews.length === 0 ? (
        <EmptyState
          title="No reviews received yet"
          message="Once creators complete studio sessions or receive delivered footage, their feedback will show here."
          icon="⭐"
        />
      ) : (
        <div className="space-y-4">
          {myReviews.map((rev) => {
            const renter = userMap.get(rev.renterId);
            return (
              <div
                key={rev.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-400 text-lg">
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)}
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{renter?.name || 'Verified Client'}</span>
                  </div>

                  <span className="text-xs text-slate-400">
                    Reviewed on {formatDate(rev.createdAt?.slice(0, 10))}
                  </span>
                </div>

                <p className="text-slate-800 text-sm leading-relaxed">&quot;{rev.comment}&quot;</p>

                {/* Owner Reply Display */}
                {rev.ownerReply ? (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Your Official Response:</span>
                      <span className="text-[10px] text-slate-400">Locked (1 reply limit)</span>
                    </div>
                    <p className="text-xs text-slate-600">&quot;{rev.ownerReply}&quot;</p>
                  </div>
                ) : (
                  <div>
                    {activeReplyId === rev.id ? (
                      <form onSubmit={handleSendReply} className="mt-3 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <label htmlFor="reply-box" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Compose Response (Allowed Once) *
                        </label>
                        <textarea
                          id="reply-box"
                          rows={3}
                          required
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Thank the creator and highlight how you accommodated their shoot..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-halo-primary"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 min-h-[44px]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-1.5 bg-halo-primary text-white font-bold rounded-xl text-xs hover:bg-halo-primary-light transition shadow disabled:opacity-50 min-h-[44px]"
                          >
                            {isSubmitting ? 'Posting...' : 'Publish Response'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleOpenReply(rev.id)}
                          className="px-4 py-2 text-xs font-bold text-halo-primary hover:bg-halo-primary/10 rounded-xl transition min-h-[44px] flex items-center"
                        >
                          💬 Reply to Client
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
