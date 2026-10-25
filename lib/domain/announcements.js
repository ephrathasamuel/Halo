import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getCurrentSession } from './auth';
import { generateId } from '@/lib/ids';

/**
 * Publish a new platform announcement.
 * Guarded write: admin only.
 *
 * @param {{ title: string, message: string }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function publishAnnouncement(input) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const isAdmin = session.roles?.includes('admin');
  if (!isAdmin) return { ok: false, error: 'Not allowed: Requires admin role' };

  if (!input.title?.trim()) return { ok: false, error: 'Title is required' };
  if (!input.message?.trim()) return { ok: false, error: 'Message content is required' };

  const { data: announcements } = readStorage(STORAGE_KEYS.ANNOUNCEMENTS, []);

  const newAnnouncement = {
    id: generateId(),
    title: input.title.trim(),
    message: input.message.trim(),
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: session.userId,
  };

  const updated = [newAnnouncement, ...announcements];
  const res = writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, updated);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: newAnnouncement };
}

/**
 * Toggle announcement active status.
 * Guarded write: admin only.
 * @param {string} id
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function toggleAnnouncement(id) {
  const session = getCurrentSession();
  if (!session?.roles?.includes('admin')) {
    return { ok: false, error: 'Not allowed: Requires admin role' };
  }

  const { data: announcements } = readStorage(STORAGE_KEYS.ANNOUNCEMENTS, []);
  const ann = announcements.find((a) => a.id === id);
  if (!ann) return { ok: false, error: 'Announcement not found' };

  const updatedAnn = { ...ann, active: !ann.active };
  const updated = announcements.map((a) => (a.id === id ? updatedAnn : a));
  const res = writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, updated);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: updatedAnn };
}

/**
 * Delete an announcement.
 * Guarded write: admin only.
 * @param {string} id
 * @returns {{ ok: boolean, error?: string }}
 */
export function deleteAnnouncement(id) {
  const session = getCurrentSession();
  if (!session?.roles?.includes('admin')) {
    return { ok: false, error: 'Not allowed: Requires admin role' };
  }

  const { data: announcements } = readStorage(STORAGE_KEYS.ANNOUNCEMENTS, []);
  const updated = announcements.filter((a) => a.id !== id);
  return writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, updated);
}

/**
 * Get active announcements for public display.
 * @returns {Array<object>}
 */
export function getActiveAnnouncements() {
  const { data: announcements } = readStorage(STORAGE_KEYS.ANNOUNCEMENTS, []);
  return announcements.filter((a) => a.active);
}
