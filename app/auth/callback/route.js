import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { DEFAULT_COUNTRY } from '@/lib/geo';
import { homeFor } from '@/lib/homeFor';
import { flushStore, readCollection, syncStore, writeCollection } from '@/lib/server/store';
import { ensureEnvAdmin, findUserByEmail, setSessionCookie } from '@/lib/server/auth';
import { OAUTH_COOKIE, googleAccountFromCode } from '@/lib/server/google';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['admin', 'regional_admin'];

/**
 * Google sends people back here (through Supabase). The verified Google email
 * signs into the Halo account with that email; a new customer account is made
 * for an email Halo hasn't seen. Admin accounts are never created this way,
 * and admins don't use Google (their page has no Google button).
 */
export async function GET(request) {
  const url = new URL(request.url);
  let saved = {};
  try {
    saved = JSON.parse(request.cookies.get(OAUTH_COOKIE)?.value || '{}');
  } catch {
    saved = {};
  }
  const portal = saved.portal === 'staff' ? 'staff' : 'customer';
  const signInPage = portal === 'staff' ? '/staff/signin' : '/signin';

  const finish = (path) => {
    const response = NextResponse.redirect(new URL(path, url.origin));
    response.cookies.delete({ name: OAUTH_COOKIE, path: '/auth' });
    return response;
  };
  const fail = (code) => finish(`${signInPage}?error=${code}`);

  const account = await googleAccountFromCode(url.searchParams.get('code'), saved.verifier);
  if (!account) return fail('failed');
  if (!account.verified) return fail('unverified');

  await syncStore();
  ensureEnvAdmin();
  let user = findUserByEmail(account.email);

  if (!user) {
    if (portal === 'staff') return fail('no-staff-account');
    user = {
      id: crypto.randomUUID(),
      name: account.name,
      email: account.email,
      phone: '',
      country: DEFAULT_COUNTRY,
      avatar: account.avatar,
      roles: ['renter'],
      status: 'active',
      signInWith: 'google',
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
    };
    writeCollection(STORAGE_KEYS.USERS, [...readCollection(STORAGE_KEYS.USERS), user]);
  }

  if (user.status === 'suspended') return fail('suspended');
  const roles = user.roles || [];
  const isAdmin = roles.some((r) => ADMIN_ROLES.includes(r));
  if (portal === 'staff' && !isAdmin) return fail('customer-account');
  if (portal === 'customer' && isAdmin) return fail('staff-account');

  await flushStore();
  await setSessionCookie(user);
  const target = user.mustChangePassword ? '/account' : saved.next || homeFor(roles);
  return finish(target);
}
