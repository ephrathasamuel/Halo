'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatETB, formatDate, formatTime } from '@/lib/format';
import { createBooking } from '@/lib/domain/bookings';
import { useSession } from '@/hooks/useSession';
import { EmptyState } from '@/components/states/EmptyState';

export default function CheckoutPage() {
  const router = useRouter();
  const { session, isSignedIn } = useSession();

  const [draft, setDraft] = useState(null);
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [fakeTxRef, setFakeTxRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Generate clearly fake transaction reference
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFakeTxRef(`TB-DEMO-${Date.now().toString().slice(-6)}-${randomSuffix}`);

    // Read checkout draft from sessionStorage
    const { data } = readStorage(STORAGE_KEYS.CHECKOUT_DRAFT, null, 'session');
    setDraft(data);

    if (session?.phone) {
      setTelebirrPhone(session.phone);
    } else {
      setTelebirrPhone('+251 911 000008');
    }
  }, [session]);

  // Auth Guard
  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <EmptyState
          title="Sign In Required"
          message="You must be signed in with a demo account to access checkout and confirm bookings."
          icon="🔐"
        />
        <Link
          href="/signin?next=/checkout"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-halo-primary text-white rounded-xl text-sm font-bold min-h-[44px]"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  // Suspended user guard
  if (session?.status === 'suspended') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto space-y-2">
          <span className="text-3xl select-none">🚫</span>
          <h1 className="text-xl font-bold text-red-800">Account Suspended</h1>
          <p className="text-sm text-red-600">
            Your demo account has been suspended. You cannot make reservations or complete checkout.
          </p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <EmptyState
          title="No Active Checkout Draft"
          message="Your booking session has expired or no items were selected. Please select a studio or equipment to book."
          icon="🛒"
        />
        <Link
          href="/browse"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-halo-primary text-white rounded-xl text-sm font-bold min-h-[44px]"
        >
          Browse Studios & Gear
        </Link>
      </div>
    );
  }

  const handleCompletePayment = () => {
    setErrorMessage('');
    setIsProcessing(true);

    const bookingPayload = {
      providerId: draft.providerId,
      ownerId: draft.ownerId,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      hours: draft.hours,
      items: draft.items,
      paymentStatus: 'paid',
      initialStatus: 'confirmed',
    };

    const res = createBooking(bookingPayload);
    setIsProcessing(false);

    if (!res.ok) {
      setErrorMessage(res.error || 'Failed to complete booking');
      return;
    }

    // Success -> redirect to receipt
    router.push(`/bookings/${res.data.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Review & Complete Reservation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your reservation breakdown and complete the simulated TeleBirr payment.
        </p>
      </div>

      {/* Simulation Warning Banner */}
      <div
        className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs text-amber-900 space-y-1"
        role="alert"
      >
        <span className="font-bold flex items-center gap-1.5 text-sm">
          <span>ℹ️</span> Simulation Notice
        </span>
        <p>
          This is an educational frontend capstone demonstration. No actual credit card, banking,
          or real TeleBirr account is charged. Do not enter real sensitive financial credentials.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5"
          role="alert"
        >
          <span className="text-base select-none">⚠️</span>
          <div>
            <strong className="block">Reservation Refused</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Order Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Booking Summary</h2>
            <p className="text-xs text-slate-500">
              Provider: <strong className="text-slate-800">{draft.providerName}</strong> (
              {draft.providerNeighbourhood}, Addis Ababa)
            </p>
          </div>

          {/* Schedule details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Date</span>
              <span className="font-bold text-slate-900 text-sm">{formatDate(draft.date)}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Time Window</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatTime(draft.startTime)} – {formatTime(draft.endTime)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Duration</span>
              <span className="font-bold text-slate-900 text-sm">{draft.hours} hours</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Itemized Items
            </h3>
            <div className="divide-y divide-slate-100 border-y border-slate-100">
              {draft.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-slate-900 block">{item.title}</span>
                    <span className="text-xs text-slate-500">
                      {formatETB(item.rateSnapshot)}/hr × {draft.hours} hrs × {item.qty} unit(s)
                      {item.deposit > 0 && ` • Deposit: ${formatETB(item.deposit * item.qty)}`}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatETB(item.lineTotal || item.rateSnapshot * draft.hours * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-2 pt-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Rental Subtotal</span>
              <span className="font-semibold text-slate-900">{formatETB(draft.subtotal)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Platform Service Fee (10%)</span>
              <span className="font-semibold text-slate-900">{formatETB(draft.fee)}</span>
            </div>

            {draft.deposit > 0 && (
              <div className="flex justify-between text-amber-800 font-medium pt-1">
                <span>Refundable Equipment Deposit</span>
                <span className="font-bold">{formatETB(draft.deposit)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
              <span>Total Amount (Birr)</span>
              <span className="text-xl text-halo-primary">{formatETB(draft.total)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mock TeleBirr Terminal */}
        <aside className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-400 tracking-wider text-base">
                telebirr
              </span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                SIMULATION
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">Mock Mobile Checkout</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label htmlFor="tb-phone" className="block text-slate-300 font-semibold mb-1">
                TeleBirr Registered Phone Number
              </label>
              <input
                id="tb-phone"
                type="tel"
                value={telebirrPhone}
                onChange={(e) => setTelebirrPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-sm min-h-[44px]"
              />
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-slate-400 block font-semibold">Simulated Transaction Ref:</span>
              <span className="font-mono text-amber-300 font-bold text-xs select-all">
                {fakeTxRef}
              </span>
            </div>

            <div className="space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <p>• TeleBirr balance check: Simulated Success</p>
              <p>• SMS OTP confirmation: Simulated (Bypassed)</p>
              <p>• Owner notification: Triggered automatically</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCompletePayment}
            disabled={isProcessing}
            className="w-full inline-flex items-center justify-center px-4 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl transition-colors shadow-lg min-h-[44px]"
          >
            {isProcessing ? 'Processing Payment...' : `Complete Demo Payment (${formatETB(draft.total)})`}
          </button>

          <p className="text-[10px] text-center text-slate-500">
            Clicking &ldquo;Complete Demo Payment&rdquo; transitions this booking to Confirmed.
          </p>
        </aside>
      </div>
    </div>
  );
}
