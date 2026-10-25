import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { DEFAULT_COUNTRY, providerLocation } from '@/lib/geo';

/*
 * Who can administer what.
 *
 *   admin           Global. Every country, and the only role that creates or
 *                   removes regional admins.
 *   regional_admin  One country (session.adminScope.country). Moderates that
 *                   country's providers and listings, its customers, bookings and
 *                   disputes. Created by a global admin only; there is no sign-up.
 *
 * Every domain write checks these helpers, so hiding a button in the UI is never
 * the only thing standing between a regional admin and another country's data.
 */

/** @param {object|null} session */
export function isGlobalAdmin(session) {
  return Boolean(session?.roles?.includes('admin'));
}

/** @param {object|null} session */
export function isRegionalAdmin(session) {
  return Boolean(session?.roles?.includes('regional_admin'));
}

/** Any admin role (global or regional). @param {object|null} session */
export function isAdminRole(session) {
  return isGlobalAdmin(session) || isRegionalAdmin(session);
}

/**
 * Country a regional admin is limited to; null for global admins (no limit).
 * @param {object|null} session
 * @returns {string|null}
 */
export function adminCountry(session) {
  if (isGlobalAdmin(session)) return null;
  return isRegionalAdmin(session) ? session.adminScope?.country || null : null;
}

/**
 * @param {object|null} session
 * @param {string|undefined} country
 */
export function canAdminCountry(session, country) {
  if (isGlobalAdmin(session)) return true;
  if (!isRegionalAdmin(session)) return false;
  const scope = session.adminScope?.country;
  return Boolean(scope) && scope === (country || DEFAULT_COUNTRY);
}

/**
 * Country a provider operates in (older records default to Ethiopia).
 * @param {string} providerId
 * @returns {string}
 */
export function countryOfProvider(providerId) {
  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.id === providerId);
  return providerLocation(provider).country;
}

/**
 * Can this session act as an admin for records belonging to this provider?
 * @param {object|null} session
 * @param {string} providerId
 */
export function canAdminProvider(session, providerId) {
  if (isGlobalAdmin(session)) return true;
  if (!isRegionalAdmin(session)) return false;
  return canAdminCountry(session, countryOfProvider(providerId));
}

/**
 * Country of a user account (older records default to Ethiopia).
 * @param {object} user
 */
export function countryOfUser(user) {
  return user?.country || DEFAULT_COUNTRY;
}
