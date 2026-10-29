'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { demoSignIn, signInWithPassword } from '@/app/actions/halo';
import { DATA_EVENT, isDemo, reloadData } from '@/lib/client/cache';
import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { AuthCard, authInputClass } from '@/components/ui/AuthCard';

const STAFF_ROLES = ['admin', 'regional_admin', 'owner'];

// Where each kind of account starts after signing in.
export function homeFor(roles = [], fallback = '/') {
  if (roles.includes('admin') || roles.includes('regional_admin')) return '/admin';
  if (roles.includes('owner')) return '/owner';
  return fallback;
}

/**
 * Email + password sign-in, shared by the customer page (/signin) and the
 * staff page (/staff/signin: admins, regional admins and studio owners).
 * Demo personas are listed only when the server runs with HALO_DEMO=on.
 */
export function SignInForm({ portal, returnPath, nextParam }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [wrongPortal, setWrongPortal] = useState('');
  const [pending, setPending] = useState(false);
  const [demo, setDemo] = useState({ on: false, users: [] });

  useEffect(() => {
    const read = () => {
      const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
      const wanted = (u) =>
        u.status !== 'suspended' &&
        (portal === 'staff' ? u.roles?.some((r) => STAFF_ROLES.includes(r)) : u.roles?.includes('renter'));
      setDemo({ on: isDemo(), users: users.filter((u) => String(u.email).endsWith('.demo')).filter(wanted) });
    };
    read();
    window.addEventListener(DATA_EVENT, read);
    return () => window.removeEventListener(DATA_EVENT, read);
  }, [portal]);

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

      {demo.on && demo.users.length > 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-halo-border-strong p-4">
          <p className="text-sm font-semibold text-halo-ink">Demo accounts</p>
          <p className="mt-1 text-xs text-halo-text-muted">Shown because this server runs in demo mode (HALO_DEMO=on).</p>
          <ul className="mt-3 grid gap-2">
            {demo.users.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={async () => {
                    setPending(true);
                    finish(await demoSignIn(u.id));
                  }}
                  className="w-full rounded-xl border border-halo-border px-3 py-2 text-left text-sm hover:border-halo-ink min-h-[44px]"
                >
                  <span className="font-semibold text-halo-ink">{u.name}</span>
                  <span className="ml-2 text-halo-text-muted">{u.roles.join(', ')}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AuthCard>
  );
}
