'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithPassword } from '@/app/actions/halo';
import { reloadData } from '@/lib/client/cache';
import { AuthCard, authInputClass } from '@/components/ui/AuthCard';
import { homeFor } from '@/lib/homeFor';

const GOOGLE_ERRORS = {
  off: 'Google sign-in is not switched on yet. Use your email and password.',
  failed: 'Google sign-in did not finish. Please try again.',
  unverified: 'Google did not confirm this email address.',
  'no-staff-account': 'There is no staff account for this Google email. Studio owners register first; admins are added by the Halo admin.',
  suspended: 'This account is suspended.',
  'staff-account': 'This is a staff account. Sign in on the staff page.',
  'customer-account': 'This is a customer account. Sign in on the customer page.',
};


/**
 * Email + password sign-in, shared by the customer page (/signin) and the
 * staff page (/staff/signin: admins, regional admins and studio owners).
 */
export function SignInForm({ portal, returnPath, nextParam, errorCode }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(GOOGLE_ERRORS[errorCode] || '');
  const [wrongPortal, setWrongPortal] = useState(
    errorCode === 'staff-account' ? 'staff' : errorCode === 'customer-account' ? 'customer' : ''
  );
  const [pending, setPending] = useState(false);
  async function finish(result) {
    if (!result?.ok) {
      setError(result?.error || 'Could not sign in');
      setWrongPortal(result?.wrongPortal || '');
      setPending(false);
      return;
    }
    await reloadData();
    const target = portal === 'staff' && (!returnPath || returnPath === '/') ? homeFor(result.session?.roles) : returnPath;
    router.push(target || '/');
    router.refresh();
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setWrongPortal('');
    setPending(true);
    finish(await signInWithPassword({ email, password, portal }));
  }

  const otherPortal = portal === 'staff' ? '/signin' : '/staff/signin';
  const linkClass = 'font-semibold text-halo-ink underline underline-offset-2 min-h-0 min-w-0';

  return (
    <AuthCard
      title={portal === 'staff' ? 'Staff sign in' : 'Sign in'}
      subtitle={
        portal === 'staff'
          ? 'For Halo admins and studio owners.'
          : 'Welcome back. Sign in to book, track requests and leave reviews.'
      }
      error={error}
      footer={
        portal === 'staff' ? (
          <>
            Booking a studio?{' '}
            <Link href="/signin" className={linkClass}>
              Customer sign in
            </Link>
          </>
        ) : (
          <>
            New to Halo?{' '}
            <Link href={nextParam ? `/signup?next=${encodeURIComponent(nextParam)}` : '/signup'} className={linkClass}>
              Create an account
            </Link>
          </>
        )
      }
    >
      {wrongPortal && (
        <p className="-mt-4 mb-6 text-sm">
          <Link href={otherPortal} className={linkClass}>
            {wrongPortal === 'staff' ? 'Go to the staff sign in' : 'Go to the customer sign in'}
          </Link>
        </p>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="signin-email" className="block text-sm font-medium text-halo-ink mb-1.5">
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
        </div>
        <div>
          <label htmlFor="signin-password" className="block text-sm font-medium text-halo-ink mb-1.5">
            Password
          </label>
          <input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-halo-ink py-3 text-[15px] font-semibold text-white hover:bg-halo-ink-soft min-h-[48px] disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-halo-text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-halo-border" />
        or
        <span className="h-px flex-1 bg-halo-border" />
      </div>
      <a
        href={`/auth/google?${new URLSearchParams({ portal, ...(nextParam ? { next: nextParam } : {}) })}`}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-halo-border-strong bg-white py-3 text-[15px] font-semibold text-halo-ink hover:border-halo-ink min-h-[48px]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        Continue with Google
      </a>

    </AuthCard>
  );
}
