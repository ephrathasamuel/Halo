'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInByEmail } from '@/lib/domain/auth';
import { safeReturnPath } from '@/lib/safeReturnPath';
import { AuthCard, authInputClass } from '@/components/ui/AuthCard';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const returnPath = safeReturnPath(nextParam);

  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const finish = (res, fallbackError) => {
    if (!res.ok) {
      setErrorMessage(res.error || fallbackError);
      return;
    }
    router.push(returnPath);
    router.refresh();
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    finish(signInByEmail(emailInput), 'No account found with that email');
  };

  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back. Sign in to book, track requests and leave reviews."
      error={errorMessage}
      footer={
        <>
          New to Halo?{' '}
          <Link
            href={nextParam ? `/signup?next=${encodeURIComponent(nextParam)}` : '/signup'}
            className="font-semibold text-halo-ink underline underline-offset-2 min-h-0 min-w-0"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label htmlFor="signin-email" className="block text-sm font-medium text-halo-ink mb-1.5">
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className={authInputClass}
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-halo-ink py-3 text-[15px] font-semibold text-white hover:bg-halo-ink-soft min-h-[48px]"
        >
          Continue
        </button>
      </form>
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <SignInContent />
    </Suspense>
  );
}
