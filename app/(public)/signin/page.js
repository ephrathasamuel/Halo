'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInAsDemo, signInByEmail } from '@/lib/domain/auth';
import { safeReturnPath } from '@/lib/safeReturnPath';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const returnPath = safeReturnPath(nextParam);

  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignIn = (userId) => {
    setErrorMessage('');
    const res = signInAsDemo(userId);
    if (!res.ok) {
      setErrorMessage(res.error || 'Failed to sign in');
      return;
    }
    router.push(returnPath);
    router.refresh();
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const res = signInByEmail(emailInput);
    if (!res.ok) {
      setErrorMessage(res.error || 'Account not found');
      return;
    }
    router.push(returnPath);
    router.refresh();
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Demo Sign In
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          No passwords required. Choose a seeded persona below or lookup your demo account by email.
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5 shadow-sm"
          role="alert"
        >
          <span className="text-base select-none">⚠️</span>
          <div className="space-y-1">
            <span className="font-bold block">Sign-in Notice</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* 1-Click Persona Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Quick Sign-In Personas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Renter Card */}
          <button
            onClick={() => handleSignIn('00000000-0000-4000-a000-000000000008')}
            className="p-4 bg-white border border-slate-200 hover:border-halo-primary rounded-xl text-left shadow-sm hover:shadow transition-all group min-h-[44px]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-slate-900 group-hover:text-halo-primary">
                Abebe Kebede
              </span>
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                Renter
              </span>
            </div>
            <p className="text-xs text-slate-500">abebe@renter.demo</p>
            <span className="text-[11px] text-slate-400 mt-2 block">Has active bookings & history</span>
          </button>

          {/* Dual Role Card */}
          <button
            onClick={() => handleSignIn('00000000-0000-4000-a000-000000000003')}
            className="p-4 bg-white border border-slate-200 hover:border-emerald-600 rounded-xl text-left shadow-sm hover:shadow transition-all group min-h-[44px]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                Dawit Alemu
              </span>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                Owner + Renter
              </span>
            </div>
            <p className="text-xs text-slate-500">dawit@merkato.demo</p>
            <span className="text-[11px] text-slate-400 mt-2 block">Merkato Frames Studio owner</span>
          </button>

          {/* Flagship Owner Card */}
          <button
            onClick={() => handleSignIn('00000000-0000-4000-a000-000000000002')}
            className="p-4 bg-white border border-slate-200 hover:border-amber-500 rounded-xl text-left shadow-sm hover:shadow transition-all group min-h-[44px]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-slate-900 group-hover:text-amber-600">
                Meron Tadesse
              </span>
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                B Light Owner
              </span>
            </div>
            <p className="text-xs text-slate-500">meron@blight.demo</p>
            <span className="text-[11px] text-slate-400 mt-2 block">Full flagship provider suite</span>
          </button>

          {/* Demo Admin Card */}
          <button
            onClick={() => handleSignIn('00000000-0000-4000-a000-000000000001')}
            className="p-4 bg-red-50/50 border border-red-200 hover:border-red-600 rounded-xl text-left shadow-sm hover:shadow transition-all group min-h-[44px]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-red-900 group-hover:text-red-700">
                Admin Demo
              </span>
              <span className="text-[11px] font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                Admin
              </span>
            </div>
            <p className="text-xs text-red-700">admin@halo.demo</p>
            <span className="text-[11px] text-red-600 mt-2 block">Moderation, users & disputes</span>
          </button>
        </div>

        {/* Suspended user test button */}
        <div className="pt-1">
          <button
            onClick={() => handleSignIn('00000000-0000-4000-a000-000000000010')}
            className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1.5 min-h-[36px]"
          >
            <span>🔒 Test suspended user (Tekle Woldemariam)</span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-halo-bg px-3 text-slate-400 font-semibold">Or sign in with email</span>
        </div>
      </div>

      {/* Email Lookup Form */}
      <form onSubmit={handleEmailSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label htmlFor="signin-email" className="block text-xs font-semibold text-slate-700 mb-1">
            Registered Email Address
          </label>
          <input
            id="signin-email"
            type="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="e.g. sara@renter.demo"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm min-h-[44px]"
          />
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-halo-primary hover:bg-halo-primary-light text-white font-semibold text-sm rounded-lg transition-colors min-h-[44px]"
        >
          Look Up Account & Sign In
        </button>
      </form>

      {/* Sign up link */}
      <p className="text-center text-sm text-slate-500">
        Don&apos;t have a demo account yet?{' '}
        <Link
          href={nextParam ? `/signup?next=${encodeURIComponent(nextParam)}` : '/signup'}
          className="font-bold text-halo-primary hover:underline min-h-[44px] inline-flex items-center"
        >
          Create Renter Account
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto px-4 py-16 text-center text-slate-500">
          Loading sign in...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
