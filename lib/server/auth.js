import 'server-only';
import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { DEFAULT_COUNTRY } from '@/lib/geo';
import { readCollection, writeCollection } from '@/lib/server/store';

/*
 * Real sign-in for Halo:
 *  - passwords stored only as scrypt hashes (users[].passwordHash);
 *  - a signed, httpOnly cookie "halo_session" holding the user id and a
 *    session version (changing a password signs out every other device);
 *  - lockout after repeated wrong passwords;
 *  - the admin account from HALO_ADMIN_EMAIL / HALO_ADMIN_PASSWORD, which
 *    also owns any storefront whose owner account doesn't exist (the
 *    storefronts Halo starts with).
 */

export const SESSION_COOKIE = 'halo_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

// .env files need "\$" for a literal "$"; hosting dashboards sometimes keep quotes.
function envValue(name) {
  return (process.env[name] || '').trim().replace(/^(["'])(.*)\1$/, '$2').split('\\$').join('$');
}

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false;
  const [, saltB64, hashB64] = stored.split('$');
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(String(password), Buffer.from(saltB64, 'base64'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

export function passwordProblem(password) {
  const value = String(password || '');
  if (value.length < 8) return 'Use at least 8 characters for your password';
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) return 'Use letters and at least one number';
  return null;
}

// Wrong-password lockout (per email, per server instance).
const attempts = globalThis.__haloAuthAttempts || (globalThis.__haloAuthAttempts = new Map());
const MAX_FAILURES = 5;
const LOCK_MS = 10 * 60 * 1000;

function isLocked(key) {
  const entry = attempts.get(key);
  return Boolean(entry?.lockedUntil && entry.lockedUntil > Date.now());
}

function recordFailure(key) {
  const entry = attempts.get(key) || { failures: 0 };
  entry.failures += 1;
  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = Date.now() + LOCK_MS;
    entry.failures = 0;
  }
  attempts.set(key, entry);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function findUserByEmail(email) {
  const target = String(email || '').trim().toLowerCase();
  return readCollection(STORAGE_KEYS.USERS).find((u) => String(u.email).toLowerCase() === target) || null;
}

export function findUserById(id) {
  return readCollection(STORAGE_KEYS.USERS).find((u) => u.id === id) || null;
}

export function updateUser(id, changes) {
  const users = readCollection(STORAGE_KEYS.USERS);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...changes };
  writeCollection(STORAGE_KEYS.USERS, users);
  return users[index];
}

/** The session object Halo's domain functions expect (same shape as before). */
export function sessionFor(user) {
  if (!user) return null;
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    status: user.status || 'active',
    country: user.country || DEFAULT_COUNTRY,
    avatar: user.avatar || '',
    mustChangePassword: Boolean(user.mustChangePassword),
    ...(user.adminScope ? { adminScope: user.adminScope } : {}),
  };
}

/** A user record with private fields removed (safe to send to a browser). */
export function publicUser(user) {
  if (!user) return user;
  const { passwordHash, envPasswordHash, sessionVersion, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
}

/** Signs in with email + password. Returns { ok, user } or { ok: false, error }. */
export function authenticate(email, password) {
  const key = `login:${String(email || '').trim().toLowerCase()}`;
  if (isLocked(key)) return { ok: false, error: 'Too many wrong passwords. Try again in 10 minutes.' };
  const user = findUserByEmail(email);
  if (!user) return { ok: false, error: 'No account found with that email', noAccount: true };
  if (!user.passwordHash) {
    return { ok: false, error: 'This account has no password yet. Ask the Halo admin to set one for you.' };
  }
  if (!verifyPassword(password, user.passwordHash)) {
    recordFailure(key);
    return { ok: false, error: 'Incorrect password' };
  }
  if (user.status === 'suspended') return { ok: false, error: 'This account has been suspended' };
  attempts.delete(key);
  return { ok: true, user };
}

/**
 * Makes sure the admin from HALO_ADMIN_EMAIL / HALO_ADMIN_PASSWORD exists and
 * can sign in. Its password follows the setting until the admin changes it in
 * the app.
 */
export function ensureEnvAdmin() {
  const email = envValue('HALO_ADMIN_EMAIL').toLowerCase();
  const password = envValue('HALO_ADMIN_PASSWORD');
  if (!email || !password) return;
  const existing = findUserByEmail(email);
  if (!existing) {
    const users = readCollection(STORAGE_KEYS.USERS);
    users.push({
      id: crypto.randomUUID(),
      name: 'Halo Admin',
      email,
      phone: '',
      country: DEFAULT_COUNTRY,
      roles: ['admin'],
      status: 'active',
      passwordHash: hashPassword(password),
      envPasswordHash: hashPassword(password),
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
    });
    writeCollection(STORAGE_KEYS.USERS, users);
    adoptOrphanedStorefronts(users[users.length - 1].id);
    return;
  }
  const changes = {};
  if (!existing.roles?.includes('admin')) changes.roles = [...new Set([...(existing.roles || []), 'admin'])];
  // The setting sets the password the first time, and again whenever the
  // setting itself changes. A password changed in the app is kept as long as
  // the setting stays the same.
  const envChanged = !existing.envPasswordHash || !verifyPassword(password, existing.envPasswordHash);
  if (!existing.passwordHash || envChanged) {
    changes.passwordHash = hashPassword(password);
    changes.envPasswordHash = hashPassword(password);
  }
  if (Object.keys(changes).length) updateUser(existing.id, changes);
  adoptOrphanedStorefronts(existing.id);
}

/**
 * Storefronts (and their listings) whose owner account doesn't exist are
 * given to the admin, who also gets the owner role to manage them.
 */
function adoptOrphanedStorefronts(adminId) {
  const userIds = new Set(readCollection(STORAGE_KEYS.USERS).map((u) => u.id));
  const providers = readCollection(STORAGE_KEYS.PROVIDERS);
  const orphaned = new Set(providers.filter((p) => !userIds.has(p.ownerId)).map((p) => p.id));
  if (orphaned.size === 0) return;
  writeCollection(
    STORAGE_KEYS.PROVIDERS,
    providers.map((p) => (orphaned.has(p.id) ? { ...p, ownerId: adminId } : p))
  );
  writeCollection(
    STORAGE_KEYS.LISTINGS,
    readCollection(STORAGE_KEYS.LISTINGS).map((l) => (orphaned.has(l.providerId) ? { ...l, ownerId: adminId } : l))
  );
  const admin = findUserById(adminId);
  if (admin && !admin.roles?.includes('owner')) updateUser(adminId, { roles: [...admin.roles, 'owner'] });
}

// ---------------------------------------------------------------------------
// Session cookie
// ---------------------------------------------------------------------------

function secret() {
  if (process.env.HALO_SESSION_SECRET) return process.env.HALO_SESSION_SECRET;
  if (!globalThis.__haloSessionSecret) {
    console.warn('[halo] HALO_SESSION_SECRET is not set. Set it in .env.local and in Vercel.');
    const serverSecret = process.env.SUPABASE_SECRET_KEY || '';
    globalThis.__haloSessionSecret = serverSecret
      ? crypto.createHmac('sha256', serverSecret).update('halo-session').digest('base64url')
      : crypto.randomBytes(32).toString('base64url');
  }
  return globalThis.__haloSessionSecret;
}

const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

function decode(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = sign(payload);
  if (!signature || signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data?.uid || Date.now() - Number(data.iat) > SESSION_MAX_AGE * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

async function isHttps() {
  const proto = (await headers()).get('x-forwarded-proto')?.split(',')[0]?.trim();
  return proto === 'https';
}

export async function setSessionCookie(user) {
  const payload = Buffer.from(JSON.stringify({ uid: user.id, v: user.sessionVersion || 1, iat: Date.now() })).toString('base64url');
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: await isHttps(),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in user's session (Halo's session shape), or null. */
export async function getServerSession() {
  const data = decode((await cookies()).get(SESSION_COOKIE)?.value);
  if (!data) return null;
  const user = findUserById(data.uid);
  if (!user || (user.sessionVersion || 1) !== data.v) return null;
  return sessionFor(user);
}
