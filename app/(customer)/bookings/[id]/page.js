'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { getBookingById, cancelBooking } from '@/lib/domain/bookings';
import { formatMoney, formatDate, formatTime } from '@/lib/format';
import { useSession } from '@/hooks/useSession';
import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { EmptyState } from '@/components/states/EmptyState';
import { STATUS_TONES, statusLabel } from '@/lib/status';
import { currencyOfProvider } from '@/lib/domain/providers';
import { BackButton } from '@/components/ui/BackButton';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { session, isSignedIn, isLoaded } = useSession();
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Wait for the stored session before showing the signed-out state
  if (!isLoaded) return <div className="min-h-[50vh]" aria-busy="true" />;

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <EmptyState
          title="Sign In Required"
          message="Please sign in to view your reservation receipt."
        />
        <Link
          href={`/signin?next=/bookings/${id}`}
          className="inline-flex items-center justify-center px-6 py-2.5 bg-halo-ink text-white rounded-xl text-sm font-semibold min-h-[44px]"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const booking = getBookingById(id);

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto space-y-2">
          <h1 className="text-xl font-semibold text-red-900">Access Denied</h1>
          <p className="text-sm text-red-700">
            This booking either does not exist or you do not have permission to view it.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 bg-halo-ink text-white rounded-lg text-sm font-semibold min-h-[44px]"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Retrieve provider details
  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.id === booking.providerId);

  const isRenter = booking.renterId === session.userId;
  const isOwner = booking.ownerId === session.userId;

  const handleCancel = () => {
    setActionError('');
    setSuccessMessage('');

    const res = cancelBooking(booking.id);
    if (!res.ok) {
      setActionError(res.error || 'Failed to cancel booking');
      return;
    }

    setSuccessMessage('Booking has been cancelled successfully.');
    router.refresh();
  };

  const statusColors = STATUS_TONES;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <BackButton fallback="/bookings" />
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-halo-text-muted flex items-center gap-2">
        <Link href="/dashboard" className="hover:text-halo-ink">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-halo-ink font-semibold truncate">
          Receipt #{booking.id.slice(-6)}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-halo-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-halo-ink">
              Booking Receipt
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                statusColors[booking.status] || 'bg-stone-100 text-stone-700'
              }`}
            >
              {statusLabel(booking.status)}
            </span>
          </div>
          <p className="text-xs text-halo-text-muted mt-1 font-mono">Ref: {booking.id}</p>
        </div>

        <div className="text-right">
          <span className="text-xs text-halo-text-muted block font-semibold">
            Payment Status
          </span>
          <span
            className={`inline-block font-semibold text-xs px-2 py-0.5 rounded mt-0.5 ${
              booking.paymentStatus === 'paid'
              ? 'bg-emerald-50 text-emerald-700'
              : booking.paymentStatus === 'refunded'
              ? 'bg-stone-100 text-stone-600'
              : 'bg-amber-50 text-amber-700'
            }`}
          >
            ● {booking.paymentStatus}
          </span>
        </div>
      </div>

      {/* Alert Notifications */}
      {actionError && (
        <div
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
          role="alert"
        >
          <strong>Action Failed:</strong> {actionError}
        </div>
      )}
      {successMessage && (
        <div
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {/* Receipt Card */}
      <div className="bg-white rounded-2xl border border-halo-border p-6 sm:p-8 space-y-6">
        {/* Studio & Provider Strip */}
        {provider && (
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-halo-border">
            <div>
              <span className="text-xs text-halo-text-muted font-semibold">Studio Provider</span>
              <h2 className="text-base font-semibold text-halo-ink">
                <Link href={`/studios/${provider.slug}`} className="hover:underline">
                  {provider.name}
                </Link>
              </h2>
              <p className="text-xs text-halo-text-muted">
                {provider.neighbourhood}, Addis Ababa, {provider.contact?.phone}
              </p>
            </div>
            <Link
              href={`/studios/${provider.slug}`}
              className="text-xs font-semibold text-halo-ink hover:underline px-3 py-1.5 min-h-[44px] flex items-center"
            >
              Storefront</Link>
          </div>
        )}

        {/* Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-halo-border pb-6 text-xs">
          <div>
            <span className="text-halo-text-muted font-semibold block">Scheduled Date</span>
            <span className="text-sm font-semibold text-halo-ink mt-0.5 block">
              {formatDate(booking.date)}
            </span>
          </div>

          <div>
            <span className="text-halo-text-muted font-semibold block">Time Window</span>
            <span className="text-sm font-semibold text-halo-ink mt-0.5 block">
              {formatTime(booking.startTime)} to {formatTime(booking.endTime)}
            </span>
          </div>

          <div>
            <span className="text-halo-text-muted font-semibold block">Duration</span>
            <span className="text-sm font-semibold text-halo-ink mt-0.5 block">
              {booking.hours} hours
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-stone-700">
            Reserved Items & Rates
          </h3>
          <div className="divide-y divide-halo-border border-y border-halo-border">
            {booking.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-halo-ink block">{item.title}</span>
                  <span className="text-xs text-halo-text-muted">
                    {formatMoney(item.rateSnapshot, booking.currency || currencyOfProvider(booking.providerId))}/hr × {booking.hours} hrs × {item.qty} unit(s)
                  </span>
                </div>
                <span className="font-semibold text-halo-ink">{formatMoney(item.lineTotal, booking.currency || currencyOfProvider(booking.providerId))}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-2 pt-2 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span className="font-semibold text-halo-ink">{formatMoney(booking.subtotal, booking.currency || currencyOfProvider(booking.providerId))}</span>
          </div>

          <div className="flex justify-between text-stone-600">
            <span>Platform Service Fee (10%)</span>
            <span className="font-semibold text-halo-ink">{formatMoney(booking.fee, booking.currency || currencyOfProvider(booking.providerId))}</span>
          </div>

          {booking.deposit > 0 && (
            <div className="flex justify-between text-amber-800 font-medium pt-1">
              <span>Security Deposit (Refundable upon gear return)</span>
              <span className="font-semibold">{formatMoney(booking.deposit, booking.currency || currencyOfProvider(booking.providerId))}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-semibold text-halo-ink pt-3 border-t border-halo-border">
            <span>Total Paid (Birr)</span>
            <span className="text-xl text-halo-ink">{formatMoney(booking.total, booking.currency || currencyOfProvider(booking.providerId))}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-6 border-t border-halo-border flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-halo-text-muted">
            Created on {new Date(booking.createdAt).toLocaleDateString()}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 24h Cancellation Action */}
            {isRenter && ['requested', 'confirmed'].includes(booking.status) && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors min-h-[44px]"
              >
                Cancel Reservation
              </button>
            )}

            {/* Owner Actions */}
            {isOwner && booking.status === 'requested' && (
              <Link
                href="/owner/bookings"
                className="px-4 py-2 bg-halo-ink text-white text-xs font-semibold rounded-lg min-h-[44px] flex items-center"
              >
                Manage in Owner Panel
              </Link>
            )}

            <Link
              href="/dashboard"
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors min-h-[44px] flex items-center"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
