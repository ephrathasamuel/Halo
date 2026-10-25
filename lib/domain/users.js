import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getCurrentSession } from './auth';

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

  const isAdmin = session.roles?.includes('admin');
  if (!isAdmin) return { ok: false, error: 'Not allowed: Requires admin role' };

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'User not found' };

  if (user.roles?.includes('admin')) {
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

  const isAdmin = session.roles?.includes('admin');
  if (!isAdmin) return { ok: false, error: 'Not allowed: Requires admin role' };

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'User not found' };

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
  if (!session?.roles?.includes('admin')) return [];

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  return users;
}
