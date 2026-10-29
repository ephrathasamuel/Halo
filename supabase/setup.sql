-- Halo: run this whole file once in Supabase > SQL Editor > New query > Run.
-- Safe to run again.
--
-- One table holds all of Halo's records (users, providers, listings, bookings,
-- quotes, reviews, disputes, announcements, purchases). Only the server can
-- read or write it, using the secret key; browsers have no access at all.

create table if not exists public.halo_records (
  collection text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

alter table public.halo_records enable row level security;
revoke all on table public.halo_records from anon, authenticated;
