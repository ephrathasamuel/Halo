import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { generateId } from '@/lib/ids';

/**
 * Get the current session from sessionStorage.
 * @returns {{ userId: string, name: string, email: string, roles: string[] } | null}
 */
export function getCurrentSession() {
  const { data } = readStorage(STORAGE_KEYS.SESSION, null, 'session');
  return data;
}

/**
 * Sign in as a demo user by user ID.
 * @param {string} userId
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function signInAsDemo(userId) {
  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { ok: false, error: 'User not found' };
  }
  if (user.status === 'suspended') {
    return { ok: false, error: 'This account has been suspended' };
  }
  const session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
  };
  const result = writeStorage(STORAGE_KEYS.SESSION, session, 'session');
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, data: session };
}

/**
 * Sign in by email lookup (demo, no password).
 * @param {string} email
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function signInByEmail(email) {
  if (!email || typeof email !== 'string') {
    return { ok: false, error: 'Email is required' };
  }
  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return { ok: false, error: 'No account found with that email' };
  }
  return signInAsDemo(user.id);
}

/**
 * Sign out. Clears session keys.
 */
export function signOut() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  sessionStorage.removeItem(STORAGE_KEYS.CHECKOUT_DRAFT);
}

/**
 * Check if a user has a specific role.
 * @param {object} user
 * @param {string} role
 * @returns {boolean}
 */
export function hasRole(user, role) {
  return Array.isArray(user?.roles) && user.roles.includes(role);
}

/**
 * Require a specific role from the current session.
 * @param {string} role
 * @returns {{ ok: boolean, session?: object, error?: string }}
 */
export function requireRole(role) {
  const session = getCurrentSession();
  if (!session) {
    return { ok: false, error: 'Not signed in' };
  }
  if (!hasRole(session, role)) {
    return { ok: false, error: `Requires ${role} role` };
  }
  return { ok: true, session };
}

/**
 * Sign up a new renter (demo). Never allows admin role.
 * @param {{ name: string, email: string, phone: string }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function signUp(input) {
  const { name, email, phone } = input || {};
  if (!name || !name.trim()) return { ok: false, error: 'Name is required' };
  if (!email || !email.trim()) return { ok: false, error: 'Email is required' };
  if (!phone || !phone.trim()) return { ok: false, error: 'Phone number is required' };

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (exists) {
    return { ok: false, error: 'An account with this email already exists' };
  }

  const newUser = {
    id: generateId(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    roles: ['renter'],
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const updated = [...users, newUser];
  const writeResult = writeStorage(STORAGE_KEYS.USERS, updated);
  if (!writeResult.ok) {
    return { ok: false, error: writeResult.error };
  }

  // Auto sign in
  return signInAsDemo(newUser.id);
}
