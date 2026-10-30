// Halo's Supabase project. Both values are public by design (the publishable
// key only allows what the database's row level security allows), so they live
// in the code instead of depending on each host's settings. The secret key is
// different: it stays in SUPABASE_SECRET_KEY (.env.local and Vercel), never here.
// HALO_SUPABASE_URL / HALO_SUPABASE_PUBLISHABLE_KEY override them (tests).
export const SUPABASE_URL = (process.env.HALO_SUPABASE_URL || 'https://shdspkxticmyluasxdxm.supabase.co').trim().replace(/\/$/, '');
export const SUPABASE_PUBLISHABLE_KEY = (process.env.HALO_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_fFs-l6XzOHNg04bbHoCmbg_Ilhqx4jc').trim();
