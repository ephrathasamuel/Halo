import { NextResponse } from 'next/server';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { readCollection, syncStore } from '@/lib/server/store';
import { ensureEnvAdmin, getServerSession, isDemoMode } from '@/lib/server/auth';
import { visibleData } from '@/lib/server/visibility';

export const dynamic = 'force-dynamic';

const SHARED_KEYS = Object.values(STORAGE_KEYS).filter(
  (key) => key !== STORAGE_KEYS.SESSION && key !== STORAGE_KEYS.CHECKOUT_DRAFT
);

/**
 * The data this visitor may see (lib/server/visibility.js), loaded from the
 * server. Passwords and session details never leave the server.
 */
export async function GET() {
  await syncStore();
  ensureEnvAdmin();
  const session = await getServerSession();
  const all = {};
  for (const key of SHARED_KEYS) all[key] = readCollection(key);
  const data = visibleData(session, all);
  // Demo mode only: the one-click personas (seeded accounts without a password).
  const demoUsers = isDemoMode()
    ? all[STORAGE_KEYS.USERS]
        .filter((u) => String(u.email).endsWith('.demo') && !u.passwordHash && u.status !== 'suspended')
        .map((u) => ({ id: u.id, name: u.name, roles: u.roles }))
    : [];
  return NextResponse.json(
    { session, demo: isDemoMode(), demoUsers, data },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
