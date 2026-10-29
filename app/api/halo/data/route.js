import { NextResponse } from 'next/server';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { readCollection, syncStore } from '@/lib/server/store';
import { ensureEnvAdmin, getServerSession } from '@/lib/server/auth';
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
  return NextResponse.json(
    { session, data: visibleData(session, all) },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
