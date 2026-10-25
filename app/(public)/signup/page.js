'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/domain/auth';
import { safeReturnPath } from '@/lib/safeReturnPath';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const returnPath = safeReturnPath(nextParam);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const res = signUp(formData);
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.error || 'Failed to create account');
      return;
    }

    router.push(returnPath);
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Demo Renter Account
        </h1>
        <p className="text-sm text-slate-500">
          Sign up to book studios, reserve cinema gear, and request production quotes in Addis Ababa.
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5"
          role="alert"
        >
          <span className="text-base select-none">⚠️</span>
          <div className="space-y-1">
            <span className="font-bold block">Registration Error</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            id="signup-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Almaz Bekele"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm min-h-[44px]"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-700 mb-1">
            Email Address *
          </label>
          <input
            id="signup-email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g. almaz@example.com"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm min-h-[44px]"
          />
        </div>

        <div>
          <label htmlFor="signup-phone" className="block text-xs font-semibold text-slate-700 mb-1">
            Phone Number *
          </label>
          <input
            id="signup-phone"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g. +251 911 234567"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm min-h-[44px]"
          />
        </div>

        <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 border border-slate-100">
          <p>
            ℹ️ <strong>Renter Account:</strong> Public sign-up creates a demo renter account. Studio
            owner privileges or administrative moderation require pre-seeded credentials.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center px-4 py-3 bg-halo-primary hover:bg-halo-primary-light text-white font-bold text-sm rounded-xl transition-colors min-h-[44px]"
        >
          {isSubmitting ? 'Creating Account...' : 'Complete Sign Up'}
        </button>
      </form>

      {/* Sign in redirect */}
      <p className="text-center text-sm text-slate-500">
        Already have a demo account?{' '}
        <Link
          href={nextParam ? `/signin?next=${encodeURIComponent(nextParam)}` : '/signin'}
          className="font-bold text-halo-primary hover:underline min-h-[44px] inline-flex items-center"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-16 text-center text-slate-500">
          Loading registration...
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
