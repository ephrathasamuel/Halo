'use server';

import { flushStore, runAs, sessionChangedTo, syncStore } from '@/lib/server/store';
import {
  authenticate,
  clearSessionCookie,
  ensureEnvAdmin,
  findUserByEmail,
  findUserById,
  getServerSession,
  hashPassword,
  isDemoMode,
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
import * as users from '@/lib/domain/users';
import { signInAsDemo, signUp, signUpProvider } from '@/lib/domain/auth';

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
  return withRequest(async () => clean(await fn(...args)));
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/** Email + password sign-in. `portal` is "customer" or "staff" (admins and owners). */
export async function signInWithPassword({ email, password, portal = 'customer' } = {}) {
  return withRequest(async () => {
    if (!email || !password) return { ok: false, error: 'Enter your email and password' };
    const result = authenticate(email, password);
    if (!result.ok) return result;
    const roles = result.user.roles || [];
    const isStaff = roles.some((r) => ['admin', 'regional_admin', 'owner'].includes(r));
    const isCustomer = roles.includes('renter');
    if (portal === 'staff' && !isStaff) {
      return { ok: false, error: 'This is a customer account. Sign in on the customer page.', wrongPortal: 'customer' };
    }
    if (portal === 'customer' && !isCustomer) {
      return { ok: false, error: 'This is a staff account. Sign in on the staff page.', wrongPortal: 'staff' };
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

/** Demo personas: only when HALO_DEMO=on (for presenting the project). */
export async function demoSignIn(userId) {
  if (!isDemoMode()) return { ok: false, error: 'Demo sign-in is switched off' };
  return withRequest(async () => {
    const result = signInAsDemo(userId);
    if (!result.ok) return result;
    const user = findUserById(sessionChangedTo()?.userId || userId);
    if (!user) return { ok: false, error: 'User not found' };
    await setSessionCookie(user);
    return { ok: true, session: sessionFor(user) };
  });
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
    if (created) updateUser(created.id, { passwordHash: hashPassword(password), sessionVersion: 1 });
    return clean(result);
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
    updateUser(target.id, { passwordHash: hashPassword(newPassword), sessionVersion: (target.sessionVersion || 1) + 1 });
    return { ok: true };
  });
}
