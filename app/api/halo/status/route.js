import { NextResponse } from 'next/server';
import { databaseStatus, syncStore } from '@/lib/server/store';
import { googleEnabled } from '@/lib/server/google';
import { SUPABASE_URL } from '@/lib/supabaseProject';

export const dynamic = 'force-dynamic';

/** Is the site set up? Plain answers only, never keys or personal data. */
export async function GET() {
  await syncStore();
  return NextResponse.json(
    {
      supabaseProject: SUPABASE_URL.replace(/^https:\/\//, '').split('.')[0].slice(0, 4) + '…',
      database: databaseStatus(),
      google: (await googleEnabled()) ? 'on' : 'off',
      adminAccount: process.env.HALO_ADMIN_EMAIL && process.env.HALO_ADMIN_PASSWORD ? 'set' : 'missing: set HALO_ADMIN_EMAIL and HALO_ADMIN_PASSWORD',
      sessionSecret: (process.env.HALO_SESSION_SECRET || '').length >= 32 ? 'set' : 'weak or missing: set HALO_SESSION_SECRET',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
