import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getCurrentSession } from './auth';
import { canAdminCountry, countryOfUser, isAdminRole, adminCountry } from './adminScope';
import { generateId } from '@/lib/ids';
import { getCountry } from '@/lib/geo';

/**
 * Suspend a user account.
 * Guarded write: admin only, cannot suspend admin demo account.
 *
 * @param {string} userId
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function suspendUser(userId) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  if (!isAdminRole(session)) return { ok: false, error: 'Not allowed: Requires admin role' };

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'User not found' };

  if (!canAdminCountry(session, countryOfUser(user))) {
    return { ok: false, error: 'Not allowed: This account is outside your region' };
  }
  if (user.roles?.includes('admin') || user.roles?.includes('regional_admin')) {
    return { ok: false, error: 'Security constraint: Cannot suspend an administrator account' };
  }

  const updatedUser = { ...user, status: 'suspended', updatedAt: new Date().toISOString() };
  const updatedList = users.map((u) => (u.id === userId ? updatedUser : u));
  const res = writeStorage(STORAGE_KEYS.USERS, updatedList);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: updatedUser };
}

/**
 * Reinstate a suspended user account.
 * Guarded write: admin only.
 *
 * @param {string} userId
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function reinstateUser(userId) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  if (!isAdminRole(session)) return { ok: false, error: 'Not allowed: Requires admin role' };

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'User not found' };
  if (!canAdminCountry(session, countryOfUser(user))) {
    return { ok: false, error: 'Not allowed: This account is outside your region' };
  }

  const updatedUser = { ...user, status: 'active', updatedAt: new Date().toISOString() };
  const updatedList = users.map((u) => (u.id === userId ? updatedUser : u));
  const res = writeStorage(STORAGE_KEYS.USERS, updatedList);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: updatedUser };
}

/**
 * Get all users for admin management.
 * Guarded read: admin only.
 * @returns {Array<object>}
 */
export function getUsersList() {
  const session = getCurrentSession();
  if (!isAdminRole(session)) return [];

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const country = adminCountry(session);
  return country ? users.filter((u) => countryOfUser(u) === country) : users;
}

/*
 * Regional admins. As in a staff system, there is no public sign-up for this
 * role: only a global admin creates, moves or removes them.
 */

function requireGlobalAdmin() {
  const session = getCurrentSession();
  if (!session) return { error: 'Not signed in' };
  if (!session.roles?.includes('admin')) return { error: 'Not allowed: Only global admins manage regional admins' };
  return { session };
}

/**
 * Create a regional admin for one country.
 * @param {{ name: string, email: string, phone?: string, country: string }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function createRegionalAdmin(input) {
  const { error } = requireGlobalAdmin();
  if (error) return { ok: false, error };

  const name = input?.name?.trim();
  const email = input?.email?.trim().toLowerCase();
  if (!name) return { ok: false, error: 'Name is required' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'A valid email is required' };
  if (!getCountry(input?.country)) return { ok: false, error: 'Choose a country Halo operates in' };

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'An account with this email already exists' };
  }

  const admin = {
    id: generateId(),
    name,
    email,
    phone: input?.phone?.trim() || '',
    country: input.country,
    roles: ['regional_admin'],
    adminScope: { country: input.country },
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  const res = writeStorage(STORAGE_KEYS.USERS, [...users, admin]);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: admin };
}

/**
 * Move a regional admin to another country.
 * @param {string} userId
 * @param {string} country
 */
export function moveRegionalAdmin(userId, country) {
  const { error } = requireGlobalAdmin();
  if (error) return { ok: false, error };
  if (!getCountry(country)) return { ok: false, error: 'Choose a country Halo operates in' };

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === userId);
  if (!user?.roles?.includes('regional_admin')) return { ok: false, error: 'Regional admin not found' };

  const updated = { ...user, country, adminScope: { country }, updatedAt: new Date().toISOString() };
  const res = writeStorage(STORAGE_KEYS.USERS, users.map((u) => (u.id === userId ? updated : u)));
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: updated };
}

/**
 * Remove the regional admin role. An account that only existed for that role
 * is deleted; anyone who also rents or owns a storefront keeps their account.
 * @param {string} userId
 */
export function removeRegionalAdmin(userId) {
  const { error } = requireGlobalAdmin();
  if (error) return { ok: false, error };

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === userId);
  if (!user?.roles?.includes('regional_admin')) return { ok: false, error: 'Regional admin not found' };

  const remainingRoles = user.roles.filter((r) => r !== 'regional_admin');
  const next =
    remainingRoles.length === 0
      ? users.filter((u) => u.id !== userId)
      : users.map((u) => {
          if (u.id !== userId) return u;
          const { adminScope, ...rest } = u; // eslint-disable-line no-unused-vars
          return { ...rest, roles: remainingRoles, updatedAt: new Date().toISOString() };
        });
  const res = writeStorage(STORAGE_KEYS.USERS, next);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

/**
 * Update the signed-in person's own profile (name, phone, country, photo).
 * Roles and admin scope can never be changed here.
 * @param {{ name?: string, phone?: string, country?: string, avatar?: string }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function updateProfile(input) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === session.userId);
  if (!user) return { ok: false, error: 'Account not found' };

  const name = input?.name?.trim() ?? user.name;
  if (!name) return { ok: false, error: 'Name is required' };
  if (input?.country && !getCountry(input.country)) return { ok: false, error: 'Choose a country Halo operates in' };

  const updated = {
    ...user,
    name,
    phone: input?.phone?.trim() ?? user.phone,
    country: input?.country || user.country,
    avatar: input?.avatar !== undefined ? input.avatar : user.avatar || '',
    updatedAt: new Date().toISOString(),
  };
  const res = writeStorage(STORAGE_KEYS.USERS, users.map((u) => (u.id === user.id ? updated : u)));
  if (!res.ok) return { ok: false, error: res.error };

  // Keep the open session in step so the header shows the new name and photo
  writeStorage(STORAGE_KEYS.SESSION, { ...session, name: updated.name, country: updated.country, avatar: updated.avatar }, 'session');
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event('halo-session-change'));
  }
  return { ok: true, data: updated };
}
