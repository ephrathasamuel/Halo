import { NextResponse } from 'next/server';
import { OAUTH_COOKIE, googleAuthorizeUrl, googleEnabled } from '@/lib/server/google';
import { safeReturnPath } from '@/lib/safeReturnPath';

export const dynamic = 'force-dynamic';

/** Starts "Continue with Google": /auth/google?portal=customer|staff&next=/path */
export async function GET(request) {
  const url = new URL(request.url);
  const portal = url.searchParams.get('portal') === 'staff' ? 'staff' : 'customer';
  const next = url.searchParams.get('next') ? safeReturnPath(url.searchParams.get('next')) : '';
  const signInPage = portal === 'staff' ? '/staff/signin' : '/signin';

  if (!(await googleEnabled())) {
    return NextResponse.redirect(new URL(`${signInPage}?error=off`, url.origin));
  }

  const { url: authorizeUrl, verifier } = googleAuthorizeUrl(`${url.origin}/auth/callback`);
  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(OAUTH_COOKIE, JSON.stringify({ verifier, portal, next }), {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/auth',
    maxAge: 600,
  });
  return response;
}
