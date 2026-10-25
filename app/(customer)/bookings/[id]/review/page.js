'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { createReview } from '@/lib/domain/reviews';
import { formatDate } from '@/lib/format';

export default function BookingReviewPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { session, isSignedIn } = useSession();

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

  if (!isSignedIn) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Please sign in to leave a review</h1>
        <Link href={`/signin?next=/bookings/${id}/review`} className="px-4 py-2 bg-halo-primary text-white rounded-xl">
          Sign In
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Booking Not Found</h1>
        <Link href="/dashboard" className="text-sm font-semibold text-halo-primary hover:underline">
          Return to dashboard
        </Link>
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
          <h2 className="text-lg font-black text-red-700">Access Denied</h2>
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
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ Review Submitted
            </span>
            <span className="text-xs text-slate-400">{formatDate(existingReview.createdAt?.slice(0, 10))}</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400 text-xl">
            {'★'.repeat(existingReview.rating)}
            {'☆'.repeat(5 - existingReview.rating)}
          </div>

          <p className="text-slate-800 text-sm leading-relaxed">&quot;{existingReview.comment}&quot;</p>

          {existingReview.ownerReply && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="text-xs font-bold text-slate-700">Owner Response from {provider?.name}:</p>
              <p className="text-xs text-slate-600">&quot;{existingReview.ownerReply}&quot;</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Link
              href={`/bookings/${id}`}
              className="text-xs font-bold text-halo-primary hover:underline min-h-[44px] flex items-center"
            >
              ← Back to Booking Receipt
            </Link>
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
          <h2 className="text-lg font-black text-amber-800">Cannot Review Yet</h2>
          <p className="text-xs text-amber-700 mt-1">
            This booking is currently <span className="font-bold">{booking.status}</span>. You can submit a review once the shoot session has completed.
          </p>
        </div>
        <Link href={`/bookings/${id}`} className="text-xs font-bold text-halo-primary hover:underline">
          View Booking Receipt
        </Link>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setIsSubmitting(true);

    const res = createReview({
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
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leave a Review</h1>
        <p className="text-xs text-slate-500 mt-1">
          Share your experience with <span className="font-bold text-slate-800">{provider?.name}</span> for your session on {formatDate(booking.date)}.
        </p>
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

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        {/* Star Rating Selector */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Overall Experience Rating *
          </span>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-3xl text-amber-400 hover:scale-125 transition min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none"
                aria-label={`${star} star rating`}
              >
                {star <= rating ? '★' : '☆'}
              </button>
            ))}
            <span className="text-xs text-slate-500 font-bold ml-2">
              {rating} of 5 Stars
            </span>
          </div>
        </div>

        {/* Comment textarea */}
        <div className="space-y-1.5">
          <label htmlFor="review-comment" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Your Review Feedback *
          </label>
          <textarea
            id="review-comment"
            rows={4}
            required
            placeholder="Tell future creators about lighting quality, studio acoustic treatment, punctuality, and staff helpfulness..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Link
            href={`/bookings/${id}`}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 min-h-[44px] flex items-center"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-halo-primary text-white font-bold rounded-xl hover:bg-halo-primary-light transition shadow disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Submitting...' : 'Post Verified Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
