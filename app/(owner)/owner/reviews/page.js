'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';
import { Star } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { replyToReview } from '@/lib/client/domain';

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

  const handleSendReply = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setIsSubmitting(true);

    const res = await replyToReview({
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-halo-border">
        <div>
          <h1 className="text-2xl font-semibold text-halo-ink">Customer Reviews & Feedback</h1>
          <p className="text-xs text-halo-text-muted mt-1">
            Read verified customer reviews and post one-time official provider responses.
          </p>
        </div>

        {myReviews.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-200">
            <Star className="h-5 w-5 fill-halo-gold text-halo-gold" aria-hidden="true" />
            <span className="text-base font-semibold text-amber-900">{avgRating} / 5.0</span>
            <span className="text-xs text-amber-700">({myReviews.length} reviews)</span>
          </div>
        )}
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

      {myReviews.length === 0 ? (
        <EmptyState
          title="No reviews received yet"
          message="Once creators complete studio sessions or receive delivered footage, their feedback will show here."
        />
      ) : (
        <div className="space-y-4">
          {myReviews.map((rev) => {
            const renter = userMap.get(rev.renterId);
            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-halo-border p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <StarRating rating={rev.rating} />
                    <span className="font-semibold text-halo-ink text-sm">{renter?.name || 'Verified Client'}</span>
                  </div>

                  <span className="text-xs text-halo-text-muted">
                    Reviewed on {formatDate(rev.createdAt?.slice(0, 10))}
                  </span>
                </div>

                <p className="text-halo-ink text-sm leading-relaxed">&quot;{rev.comment}&quot;</p>

                {/* Owner Reply Display */}
                {rev.ownerReply ? (
                  <div className="mt-3 p-4 rounded-2xl bg-stone-50 border border-halo-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-halo-ink">Your Official Response:</span>
                      <span className="text-[10px] text-halo-text-muted">Locked (1 reply limit)</span>
                    </div>
                    <p className="text-xs text-stone-600">&quot;{rev.ownerReply}&quot;</p>
                  </div>
                ) : (
                  <div>
                    {activeReplyId === rev.id ? (
                      <form onSubmit={handleSendReply} className="mt-3 space-y-3 bg-stone-50 p-4 rounded-2xl border border-halo-border">
                        <label htmlFor="reply-box" className="block text-xs font-semibold text-stone-700">
                          Compose Response (Allowed Once) *
                        </label>
                        <textarea
                          id="reply-box"
                          rows={3}
                          required
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Thank the creator and highlight how you accommodated their shoot..."
                          className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-xs focus:outline-none focus:ring-2 focus:ring-halo-primary"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200 min-h-[44px]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-1.5 bg-halo-ink text-white font-semibold rounded-xl text-xs hover:bg-halo-ink-soft transition disabled:opacity-50 min-h-[44px]"
                          >
                            {isSubmitting ? 'Posting...' : 'Publish Response'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleOpenReply(rev.id)}
                          className="px-4 py-2 text-xs font-semibold text-halo-ink hover:bg-halo-ink/10 rounded-xl transition min-h-[44px] flex items-center"
                        >
                          Reply to Client
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
