'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CalendarDays, Clock, Lock, MapPin, ShieldAlert, ShoppingBag } from 'lucide-react';
import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatMoney, formatDate, formatTime } from '@/lib/format';
import { useSession } from '@/hooks/useSession';
import { EmptyState } from '@/components/states/EmptyState';
import { BackButton } from '@/components/ui/BackButton';
import { createBooking } from '@/lib/client/domain';

const buttonClass =
  'inline-flex items-center px-5 bg-halo-ink text-white rounded-xl text-sm font-semibold hover:bg-halo-ink-soft';

export default function CheckoutPage() {
  const router = useRouter();
  const { session, isSignedIn, isLoaded } = useSession();

  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // The draft is written by the booking panel on the listing page
    const { data } = readStorage(STORAGE_KEYS.CHECKOUT_DRAFT, null, 'session');
    setDraft(data);
    setLoaded(true);
  }, []);

  if (!loaded) return <div className="min-h-[60vh]" aria-busy="true" />;

  // Wait for the stored session before showing the signed-out state
  if (!isLoaded) return <div className="min-h-[50vh]" aria-busy="true" />;

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState icon={Lock} title="Sign in to finish booking" message="Your booking details are saved. Sign in to send the request.">
          <Link href="/signin?next=/checkout" className={buttonClass}>
            Sign in
          </Link>
        </EmptyState>
      </div>
    );
  }

  if (session?.status === 'suspended') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Your account is suspended"
          message="Suspended accounts can't make bookings. Contact Halo support if you think this is a mistake."
        />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to book yet"
          message="Pick a studio or piece of equipment, choose a time, and you'll come back here to confirm."
        >
          <Link href="/browse" className={buttonClass}>
            Browse listings
          </Link>
        </EmptyState>
      </div>
    );
  }

  // Drafts saved before currencies existed are in Ethiopian Birr
  const currency = draft.currency || 'ETB';

  const handleSendRequest = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    // Payment is not collected online yet: the booking starts as a request
    // (status "requested", payment "pending") and the provider confirms it.
    const res = await createBooking({
      providerId: draft.providerId,
      ownerId: draft.ownerId,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      hours: draft.hours,
      items: draft.items,
    });
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.error || 'We could not send this request. Please try again.');
      return;
    }

    router.push(`/bookings/${res.data.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BackButton fallback="/browse" />
      <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-halo-ink">Request to book</h1>
      <p className="mt-2 text-halo-text-muted">
        Check the details, then send your request to {draft.providerName}.
      </p>

      {errorMessage && (
        <p className="mt-6 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-halo-error" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 items-start">
        <div className="space-y-8">
          <section aria-labelledby="when-heading">
            <h2 id="when-heading" className="text-xl font-semibold text-halo-ink">When and where</h2>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 text-halo-ink" strokeWidth={1.75} aria-hidden="true" />
                <div>
                  <dt className="text-sm text-halo-text-muted">Date</dt>
                  <dd className="font-medium text-halo-ink">{formatDate(draft.date)}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-halo-ink" strokeWidth={1.75} aria-hidden="true" />
                <div>
                  <dt className="text-sm text-halo-text-muted">Time</dt>
                  <dd className="font-medium text-halo-ink">
                    {formatTime(draft.startTime)} to {formatTime(draft.endTime)}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-halo-ink" strokeWidth={1.75} aria-hidden="true" />
                <div>
                  <dt className="text-sm text-halo-text-muted">Provider</dt>
                  <dd className="font-medium text-halo-ink">
                    {draft.providerName}, {draft.providerNeighbourhood}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section aria-labelledby="items-heading" className="border-t border-halo-border pt-8">
            <h2 id="items-heading" className="text-xl font-semibold text-halo-ink">What you&apos;re booking</h2>
            <ul className="mt-4 divide-y divide-halo-border">
              {draft.items.map((item, idx) => (
                <li key={idx} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-halo-ink">{item.title}</p>
                    <p className="text-sm text-halo-text-muted tabular">
                      {formatMoney(item.rateSnapshot, currency)} per hour, {draft.hours} hours
                      {item.qty > 1 ? `, ${item.qty} units` : ''}
                    </p>
                  </div>
                  <p className="font-medium text-halo-ink tabular">
                    {formatMoney(item.lineTotal || item.rateSnapshot * draft.hours * item.qty, currency)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="next-heading" className="border-t border-halo-border pt-8">
            <h2 id="next-heading" className="text-xl font-semibold text-halo-ink">What happens next</h2>
            <ol className="mt-4 space-y-3 text-halo-ink/85">
              <li>1. {draft.providerName} gets your request and confirms or declines it.</li>
              <li>2. You see the status on your bookings page.</li>
              <li>3. You arrange payment with the provider before the booking date.</li>
            </ol>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 rounded-2xl border border-halo-border bg-white p-6 shadow-[0_8px_30px_rgba(22,24,29,0.08)]">
          <h2 className="font-semibold text-halo-ink">Price details</h2>
          <dl className="mt-4 space-y-2 text-[15px] tabular">
            <div className="flex justify-between text-halo-text-muted">
              <dt>Rental</dt>
              <dd className="text-halo-ink">{formatMoney(draft.subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between text-halo-text-muted">
              <dt>Halo service fee</dt>
              <dd className="text-halo-ink">{formatMoney(draft.fee, currency)}</dd>
            </div>
            {draft.deposit > 0 && (
              <div className="flex justify-between text-halo-text-muted">
                <dt>Refundable deposit</dt>
                <dd className="text-halo-ink">{formatMoney(draft.deposit, currency)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-halo-border pt-3 font-semibold text-halo-ink">
              <dt>Total</dt>
              <dd>{formatMoney(draft.total, currency)}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={handleSendRequest}
            disabled={isSubmitting}
            className="mt-6 w-full rounded-xl bg-halo-ink py-3.5 text-[15px] font-semibold text-white hover:bg-halo-ink-soft disabled:opacity-60 min-h-[48px]"
          >
            {isSubmitting ? 'Sending request' : 'Send booking request'}
          </button>
          <p className="mt-3 text-[13px] text-center text-halo-text-muted">
            You won&apos;t be charged by Halo for this request.
          </p>
        </aside>
      </div>
    </div>
  );
}
