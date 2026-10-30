'use server';

import { flushStore, readCollection, runAs, syncStore, writeCollection } from '@/lib/server/store';
import {
  authenticate,
  clearSessionCookie,
  ensureEnvAdmin,
  findUserByEmail,
  findUserById,
  getServerSession,
  hashPassword,
  passwordProblem,
  sessionFor,
  setSessionCookie,
  updateUser,
  verifyPassword,
} from '@/lib/server/auth';
import * as announcements from '@/lib/domain/announcements';
import * as bookings from '@/lib/domain/bookings';
import * as disputes from '@/lib/domain/disputes';
import * as events from '@/lib/domain/events';
import * as listings from '@/lib/domain/listings';
import * as providers from '@/lib/domain/providers';
import * as reviews from '@/lib/domain/reviews';
import * as sales from '@/lib/domain/sales';
import * as settings from '@/lib/domain/settings';
import * as users from '@/lib/domain/users';
import { signUp, signUpProvider } from '@/lib/domain/auth';
import { canAdminProvider, countryOfProvider } from '@/lib/domain/adminScope';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import crypto from 'node:crypto';

/*
 * Every change in Halo goes through here. Each call:
 *   1. loads the latest shared data,
 *   2. reads who is asking from the signed session cookie,
 *   3. runs Halo's own domain function on the server, which applies its usual
 *      checks (session, role, ownership, state machine, input),
 *   4. saves the result before answering.
 * The browser can't skip step 3: it only names the function and its input.
 */

// Domain functions a page may call. Reads are served by /api/halo/data.
const CALLABLE = {
  'announcements.publishAnnouncement': announcements.publishAnnouncement,
  'announcements.toggleAnnouncement': announcements.toggleAnnouncement,
  'announcements.deleteAnnouncement': announcements.deleteAnnouncement,
  'bookings.createBooking': bookings.createBooking,
  'bookings.cancelBooking': bookings.cancelBooking,
  'bookings.transitionBooking': bookings.transitionBooking,
  'bookings.createOwnerBooking': bookings.createOwnerBooking,
  'disputes.openDispute': disputes.openDispute,
  'disputes.resolveDispute': disputes.resolveDispute,
  'events.submitEventRequest': events.submitEventRequest,
  'events.sendQuote': events.sendQuote,
  'events.respondToQuote': events.respondToQuote,
  'events.advanceEvent': events.advanceEvent,
  'listings.saveListing': listings.saveListing,
  'listings.deactivateListing': listings.deactivateListing,
  'listings.updateListingAvailability': listings.updateListingAvailability,
  'listings.moderateListing': listings.moderateListing,
  'providers.saveProvider': providers.saveProvider,
  'providers.savePortfolioItem': providers.savePortfolioItem,
  'providers.deletePortfolioItem': providers.deletePortfolioItem,
  'providers.moderateProvider': providers.moderateProvider,
  'reviews.createReview': reviews.createReview,
  'reviews.replyToReview': reviews.replyToReview,
  'sales.createPurchaseRequest': sales.createPurchaseRequest,
  'sales.updatePurchaseRequest': sales.updatePurchaseRequest,
  'users.suspendUser': users.suspendUser,
  'users.reinstateUser': users.reinstateUser,
  'users.moveRegionalAdmin': users.moveRegionalAdmin,
  'users.removeRegionalAdmin': users.removeRegionalAdmin,
  'users.updateProfile': users.updateProfile,
  'settings.setBookingsPaused': settings.setBookingsPaused,
};

async function withRequest(fn) {
  await syncStore();
  ensureEnvAdmin();
  const session = await getServerSession();
  try {
    return await runAs(session, () => fn(session));
  } finally {
    await flushStore();
  }
}

// Results go to the browser: never include password hashes.
function clean(result) {
  return JSON.parse(
    JSON.stringify(result ?? null, (key, value) =>
      key === 'passwordHash' || key === 'envPasswordHash' || key === 'sessionVersion' ? undefined : value
    )
  );
}

/** Runs one of Halo's domain functions as the signed-in user. */
export async function callDomain(name, args = []) {
  const fn = CALLABLE[name];
  if (!fn) return { ok: false, error: 'Unknown action' };
  if (!Array.isArray(args) || args.length > 4) return { ok: false, error: 'Invalid request' };
  return withRequest(async (session) => {
    if (session?.mustChangePassword) {
      return { ok: false, error: 'Choose your own password first (Profile, Password).' };
    }
    return clean(await fn(...args));
  });
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/** Email + password sign-in. `portal` is "customer" (customers and providers) or "staff" (admins only). */
export async function signInWithPassword({ email, password, portal = 'customer' } = {}) {
  return withRequest(async () => {
    if (!email || !password) return { ok: false, error: 'Enter your email and password' };
    const result = authenticate(email, password);
    if (!result.ok) return result;
    const roles = result.user.roles || [];
    const isAdmin = roles.some((r) => r === 'admin' || r === 'regional_admin');
    if (portal === 'staff' && !isAdmin) {
      return { ok: false, error: 'This is not an admin account. Customers and providers sign in on the main page.', wrongPortal: 'customer' };
    }
    if (portal !== 'staff' && isAdmin) {
      return { ok: false, error: 'This is an admin account. Sign in on the admin page.', wrongPortal: 'staff' };
    }
    await setSessionCookie(result.user);
    return { ok: true, session: sessionFor(result.user) };
  });
}

// Creating an account: Halo's own sign-up rules, then the password.
async function createAccount(domainSignUp, input) {
  const problem = passwordProblem(input?.password);
  if (problem) return { ok: false, error: problem };
  const { password, ...profile } = input || {};
  const result = domainSignUp(profile);
  if (!result.ok) return result;
  const created = findUserByEmail(profile.email);
  if (!created) return { ok: false, error: 'Could not create the account' };
  const user = updateUser(created.id, { passwordHash: hashPassword(password), sessionVersion: 1 });
  await setSessionCookie(user);
  return { ok: true, session: sessionFor(user) };
}

export async function signUpWithPassword(input) {
  return withRequest(() => createAccount(signUp, input));
}

export async function signUpProviderWithPassword(input) {
  return withRequest(() => createAccount(signUpProvider, input));
}

export async function signOutAction() {
  await clearSessionCookie();
  return { ok: true };
}

export async function changePassword({ currentPassword, newPassword } = {}) {
  return withRequest(async (session) => {
    if (!session) return { ok: false, error: 'Not signed in' };
    const user = findUserById(session.userId);
    if (user.passwordHash && !verifyPassword(currentPassword, user.passwordHash)) {
      return { ok: false, error: 'Your current password is incorrect' };
    }
    const problem = passwordProblem(newPassword);
    if (problem) return { ok: false, error: problem };
    // A new session version signs out every other device.
    const updated = updateUser(user.id, {
      passwordHash: hashPassword(newPassword),
      sessionVersion: (user.sessionVersion || 1) + 1,
      mustChangePassword: false,
    });
    await setSessionCookie(updated);
    return { ok: true };
  });
}

/** Global admin creates a regional admin, with a first password for them. */
export async function createRegionalAdminWithPassword(input) {
  return withRequest(async () => {
    const problem = passwordProblem(input?.password);
    if (problem) return { ok: false, error: problem };
    const { password, ...profile } = input || {};
    const result = users.createRegionalAdmin(profile);
    if (!result.ok) return clean(result);
    const created = findUserByEmail(profile.email);
    // A password someone else chose: they pick their own when they first sign in.
    if (created) updateUser(created.id, { passwordHash: hashPassword(password), sessionVersion: 1, mustChangePassword: true });
    return clean(result);
  });
}

/**
 * An admin gives a storefront with no owner to its real owner: their own
 * account (name, email, first password they change when they first sign in),
 * separate from any admin account. An existing customer account with that
 * email becomes the owner instead of a new one being made.
 */
export async function assignStorefrontOwner({ providerId, name, email, phone, password } = {}) {
  return withRequest(async (session) => {
    const roles = session?.roles || [];
    if (!roles.includes('admin') && !roles.includes('regional_admin')) return { ok: false, error: 'Only admins can do this' };
    const provider = readCollection(STORAGE_KEYS.PROVIDERS).find((p) => p.id === providerId);
    if (!provider) return { ok: false, error: 'Storefront not found' };
    if (!canAdminProvider(session, provider.id)) return { ok: false, error: 'This storefront is not in your country' };
    if (provider.ownerId && findUserById(provider.ownerId)) return { ok: false, error: 'This storefront already has an owner' };

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();
    if (!cleanName) return { ok: false, error: "Enter the owner's name" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, error: "Enter the owner's email" };

    let owner = findUserByEmail(cleanEmail);
    const existing = Boolean(owner);
    if (owner) {
      if (owner.roles?.some((r) => r === 'admin' || r === 'regional_admin')) {
        return { ok: false, error: 'That email belongs to an admin. Providers need their own account.' };
      }
      if (owner.status === 'suspended') return { ok: false, error: 'That account is suspended' };
      owner = updateUser(owner.id, { roles: [...new Set([...(owner.roles || []), 'owner'])] });
    } else {
      const problem = passwordProblem(password);
      if (problem) return { ok: false, error: problem };
      owner = {
        id: crypto.randomUUID(),
        name: cleanName,
        email: cleanEmail,
        phone: String(phone || '').trim(),
        country: countryOfProvider(provider.id),
        roles: ['renter', 'owner'],
        status: 'active',
        passwordHash: hashPassword(password),
        mustChangePassword: true,
        sessionVersion: 1,
        createdAt: new Date().toISOString(),
      };
      writeCollection(STORAGE_KEYS.USERS, [...readCollection(STORAGE_KEYS.USERS), owner]);
    }

    writeCollection(
      STORAGE_KEYS.PROVIDERS,
      readCollection(STORAGE_KEYS.PROVIDERS).map((p) => (p.id === provider.id ? { ...p, ownerId: owner.id } : p))
    );
    writeCollection(
      STORAGE_KEYS.LISTINGS,
      readCollection(STORAGE_KEYS.LISTINGS).map((l) => (l.providerId === provider.id ? { ...l, ownerId: owner.id } : l))
    );
    return { ok: true, existingAccount: existing };
  });
}

/**
 * An admin sets a new password for someone who forgot theirs (Halo has no
 * email service yet). Global admins: anyone except another global admin.
 * Regional admins: non-admin accounts in their own country. Signs the person
 * out everywhere.
 */
export async function adminSetPassword({ userId, newPassword } = {}) {
  return withRequest(async (session) => {
    const roles = session?.roles || [];
    const isGlobal = roles.includes('admin');
    const isRegional = roles.includes('regional_admin');
    if (!isGlobal && !isRegional) return { ok: false, error: 'Only admins can do this' };
    const target = findUserById(userId);
    if (!target) return { ok: false, error: 'User not found' };
    if (target.id === session.userId) return { ok: false, error: 'Change your own password in your account' };
    if (target.roles?.includes('admin')) return { ok: false, error: "Another global admin's password can't be set here" };
    if (!isGlobal) {
      const sameCountry = (target.country || 'ET') === session.adminScope?.country;
      if (!sameCountry || target.roles?.includes('regional_admin')) {
        return { ok: false, error: 'You can only do this for customers and providers in your country' };
      }
    }
    const problem = passwordProblem(newPassword);
    if (problem) return { ok: false, error: problem };
    updateUser(target.id, {
      passwordHash: hashPassword(newPassword),
      sessionVersion: (target.sessionVersion || 1) + 1,
      mustChangePassword: true,
    });
    return { ok: true };
  });
}
