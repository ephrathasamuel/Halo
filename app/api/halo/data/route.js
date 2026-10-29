import { NextResponse } from 'next/server';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { readCollection, syncStore } from '@/lib/server/store';
import { ensureEnvAdmin, getServerSession, isDemoMode, publicUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const SHARED_KEYS = Object.values(STORAGE_KEYS).filter(
  (key) => key !== STORAGE_KEYS.SESSION && key !== STORAGE_KEYS.CHECKOUT_DRAFT
);

/**
 * Everything the browser shows, loaded from the server.
 * Passwords and session details never leave the server. (Stage 2 narrows each
 * collection to what the signed-in role may see.)
 */
export async function GET() {
  await syncStore();
  ensureEnvAdmin();
  const session = await getServerSession();
  const data = {};
  for (const key of SHARED_KEYS) {
    const list = readCollection(key);
    data[key] = key === STORAGE_KEYS.USERS ? list.map(publicUser) : list;
  }
  return NextResponse.json(
    { session, demo: isDemoMode(), data },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
