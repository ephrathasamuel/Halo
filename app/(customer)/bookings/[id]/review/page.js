'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { StarRating, StarRatingInput } from '@/components/ui/StarRating';
import { BackButton } from '@/components/ui/BackButton';
import { createReview } from '@/lib/client/domain';

export default function BookingReviewPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { session, isSignedIn, isLoaded } = useSession();

  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: reviews } = useStorageSync(STORAGE_KEYS.REVIEWS, []);

  const booking = bookings.find((b) => b.id === id);
  const provider = providers.find((p) => p.id === booking?.providerId);
  const existingReview = reviews.find((r) => r.targetType === 'booking' && r.targetId === id);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wait for the stored session before showing the signed-out state
  if (!isLoaded) return <div className="min-h-[50vh]" aria-busy="true" />;

  if (!isSignedIn) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-xl font-semibold text-halo-ink">Please sign in to leave a review</h1>
        <Link href={`/signin?next=/bookings/${id}/review`} className="px-4 py-2 bg-halo-ink text-white rounded-xl">
          Sign In
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-xl font-semibold text-halo-ink">Booking Not Found</h1>
        <BackButton fallback="/dashboard" />
      </div>
    );
  }

  // Ownership Guard
  const isRenter = booking.renterId === session.userId;
  const isAdmin = session.roles?.includes('admin');
  if (!isRenter && !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
          <h2 className="text-lg font-semibold text-red-700">Access Denied</h2>
          <p className="text-xs text-red-600 mt-1">
            You can only review bookings made from your own account.
          </p>
        </div>
      </div>
    );
  }

  // Already reviewed view
  if (existingReview) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-halo-border p-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Review Submitted
            </span>
            <span className="text-xs text-halo-text-muted">{formatDate(existingReview.createdAt?.slice(0, 10))}</span>
          </div>

          <StarRating rating={existingReview.rating} size="h-5 w-5" />

          <p className="text-halo-ink text-sm leading-relaxed">&quot;{existingReview.comment}&quot;</p>

          {existingReview.ownerReply && (
            <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-halo-border space-y-1">
              <p className="text-xs font-semibold text-stone-700">Owner Response from {provider?.name}:</p>
              <p className="text-xs text-stone-600">&quot;{existingReview.ownerReply}&quot;</p>
            </div>
          )}

          <div className="pt-4 border-t border-halo-border flex justify-end">
            <BackButton fallback={`/bookings/${id}`} />
          </div>
        </div>
      </div>
    );
  }

  // Ineligible status check
  if (booking.status !== 'completed') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl">
          <h2 className="text-lg font-semibold text-amber-800">Cannot Review Yet</h2>
          <p className="text-xs text-amber-700 mt-1">
            This booking is currently <span className="font-semibold">{booking.status}</span>. You can submit a review once the shoot session has completed.
          </p>
        </div>
        <Link href={`/bookings/${id}`} className="text-xs font-semibold text-halo-ink hover:underline">
          View Booking Receipt
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setIsSubmitting(true);

    const res = await createReview({
      targetType: 'booking',
      targetId: booking.id,
      rating,
      comment,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to submit review' });
      return;
    }

    router.push(`/bookings/${booking.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="pb-4 border-b border-halo-border">
        <h1 className="text-2xl font-semibold text-halo-ink">Leave a Review</h1>
        <p className="text-xs text-halo-text-muted mt-1">
          Share your experience with <span className="font-semibold text-halo-ink">{provider?.name}</span> for your session on {formatDate(booking.date)}.
        </p>
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

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-halo-border p-6 md:p-8 space-y-6">
        {/* Star Rating Selector */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-stone-700">
            Overall Experience Rating *
          </span>
          <div className="flex items-center gap-2">
            <StarRatingInput value={rating} onChange={setRating} />
            <span className="text-xs text-halo-text-muted font-semibold ml-2">
              {rating} of 5 Stars
            </span>
          </div>
        </div>

        {/* Comment textarea */}
        <div className="space-y-1.5">
          <label htmlFor="review-comment" className="block text-xs font-semibold text-stone-700">
            Your Review Feedback *
          </label>
          <textarea
            id="review-comment"
            rows={4}
            required
            placeholder="Tell future creators about lighting quality, studio acoustic treatment, punctuality, and staff helpfulness..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary"
          />
        </div>

        <div className="pt-4 border-t border-halo-border flex items-center justify-between">
          <Link
            href={`/bookings/${id}`}
            className="text-xs font-semibold text-stone-600 hover:text-halo-ink min-h-[44px] flex items-center"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-halo-ink text-white font-semibold rounded-xl hover:bg-halo-ink-soft transition disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Submitting...' : 'Post Verified Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
