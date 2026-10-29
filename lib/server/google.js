import 'server-only';
import crypto from 'node:crypto';

/*
 * "Continue with Google", through Supabase Auth (PKCE flow, no extra package):
 *   1. /auth/google sends the browser to Supabase, which sends it to Google;
 *   2. Google returns to Supabase, which returns to /auth/callback?code=...;
 *   3. the callback trades the code for the Google account's verified email,
 *      then signs that person into Halo with Halo's own session cookie.
 * Supabase only vouches for the email; Halo's accounts and roles stay in Halo.
 */

export const OAUTH_COOKIE = 'halo_oauth';

function supabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim();
  return url && key ? { url, key } : null;
}

/** True when Supabase is set up and its Google provider is switched on. */
export async function googleEnabled() {
  const config = supabase();
  if (!config) return false;
  try {
    const response = await fetch(`${config.url}/auth/v1/settings`, { headers: { apikey: config.key }, cache: 'no-store' });
    if (!response.ok) return false;
    return Boolean((await response.json())?.external?.google);
  } catch {
    return false;
  }
}

/** Where to send the browser, plus the secret it must bring back. */
export function googleAuthorizeUrl(callbackUrl) {
  const { url } = supabase();
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const query = new URLSearchParams({
    provider: 'google',
    redirect_to: callbackUrl,
    code_challenge: challenge,
    code_challenge_method: 's256',
  });
  return { url: `${url}/auth/v1/authorize?${query}`, verifier };
}

/** Trades the returned code for the Google account: { email, name, avatar } or null. */
export async function googleAccountFromCode(code, verifier) {
  const config = supabase();
  if (!config || !code || !verifier) return null;
  const response = await fetch(`${config.url}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    cache: 'no-store',
    headers: { apikey: config.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  });
  if (!response.ok) {
    console.warn('[halo] Google sign-in: code exchange failed', response.status);
    return null;
  }
  const user = (await response.json())?.user;
  if (!user?.email) return null;
  const meta = user.user_metadata || {};
  return {
    email: String(user.email).toLowerCase(),
    verified: Boolean(user.email_confirmed_at || meta.email_verified),
    name: String(meta.full_name || meta.name || user.email.split('@')[0]).slice(0, 80),
    avatar: typeof meta.avatar_url === 'string' && meta.avatar_url.startsWith('https://') ? meta.avatar_url : '',
  };
}
