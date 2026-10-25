'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInAsDemo, signInByEmail } from '@/lib/domain/auth';
import { safeReturnPath } from '@/lib/safeReturnPath';
import { AuthCard, authInputClass } from '@/components/ui/AuthCard';

/*
 * Test accounts from the seed data, offered only while running `npm run dev`.
 * They never render in a production build. Supabase Auth replaces this whole
 * sign-in (email + password or one-time code) when the backend is connected.
 */
const DEV_ACCOUNTS =
  process.env.NODE_ENV === 'development'
    ? [
        { id: '00000000-0000-4000-a000-000000000008', name: 'Abebe Kebede', role: 'Renter' },
        { id: '00000000-0000-4000-a000-000000000003', name: 'Dawit Alemu', role: 'Owner and renter' },
        { id: '00000000-0000-4000-a000-000000000002', name: 'Meron Tadesse', role: 'B Light owner' },
        { id: '00000000-0000-4000-a000-000000000001', name: 'Platform admin', role: 'Global admin' },
        { id: '00000000-0000-4000-a000-000000000011', name: 'Ethiopia Admin', role: 'Regional admin, Ethiopia' },
        { id: '00000000-0000-4000-a000-000000000012', name: 'Kenya Admin', role: 'Regional admin, Kenya' },
        { id: '00000000-0000-4000-a000-000000000013', name: 'Wanjiru Kamau', role: 'Owner, Nairobi' },
        { id: '00000000-0000-4000-a000-000000000014', name: 'Brian Otieno', role: 'Renter, Kenya' },
        { id: '00000000-0000-4000-a000-000000000010', name: 'Tekle Woldemariam', role: 'Suspended' },
      ]
    : [];

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

      {DEV_ACCOUNTS.length > 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-halo-border-strong p-4">
          <p className="text-sm font-medium text-halo-ink">Test accounts</p>
          <p className="text-[13px] text-halo-text-muted">Development only. Not shown on the live site.</p>
          <ul className="mt-3 divide-y divide-halo-border">
            {DEV_ACCOUNTS.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    finish(signInAsDemo(a.id), 'Failed to sign in');
                  }}
                  className="w-full flex items-center justify-between py-2 text-left text-sm hover:text-halo-ink"
                >
                  <span className="font-medium text-halo-ink">{a.name}</span>
                  <span className="text-halo-text-muted">{a.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
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
