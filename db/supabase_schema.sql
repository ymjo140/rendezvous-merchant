-- =========================================================
-- Supabase schema for Rendezvous Merchant Console (MVP)
-- NOTE: Policies below are permissive for development.
--       Tighten them with auth.uid() + store ownership later.
-- =========================================================

create extension if not exists "pgcrypto";

-- 1) Table units (capacity)
create table if not exists public.table_units (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  name text not null,
  min_capacity integer not null default 1,
  max_capacity integer not null default 1,
  quantity integer not null default 1,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_table_units_store
  on public.table_units(store_id);

-- 2) Benefits catalog
create table if not exists public.offer_benefits_catalog (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  title text not null,
  category text not null,
  type text not null,
  value text,
  is_active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_benefits_store
  on public.offer_benefits_catalog(store_id);

-- 3) Offer rules
create table if not exists public.offer_rules (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  name text not null,
  enabled boolean not null default true,
  days boolean[] not null default '{}',
  recurrence_days jsonb not null default '[]',
  active_time_start time,
  active_time_end time,
  is_auto_apply boolean not null default false,
  time_blocks jsonb not null default '[]',
  party_min integer,
  party_max integer,
  lead_min integer,
  lead_max integer,
  benefit_id text,
  benefit_title text,
  benefit_type text,
  benefit_value text,
  guardrails jsonb,
  visibility text default 'public',
  created_at timestamptz not null default now()
);

create index if not exists idx_offer_rules_store
  on public.offer_rules(store_id);

-- 4) Reservations (including blocks)
create table if not exists public.reservations (
  id text primary key,
  store_id text not null,
  guest_name text not null,
  guest_phone text,
  party_size integer not null default 1,
  date text not null,
  status text not null,
  unit_id text not null,
  unit_index integer not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  notes text,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reservations_store
  on public.reservations(store_id);

-- 5) Time deals
create table if not exists public.time_deals (
  id text primary key,
  store_id text not null,
  benefit_id text not null,
  title text not null,
  date text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_time_deals_store
  on public.time_deals(store_id);

-- 6) Store menus
create table if not exists public.store_menus (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  name text not null,
  price integer,
  category text not null default 'MAIN',
  image_url text,
  is_recommended boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_store_menus_store
  on public.store_menus(store_id);

-- =====================
-- RLS (Dev permissive)
-- =====================
alter table public.table_units enable row level security;
alter table public.offer_benefits_catalog enable row level security;
alter table public.offer_rules enable row level security;
alter table public.reservations enable row level security;
alter table public.time_deals enable row level security;
alter table public.store_menus enable row level security;

-- Allow all operations for anon/authenticated (DEV ONLY)
create policy "dev_all_table_units" on public.table_units
  for all using (true) with check (true);

create policy "dev_all_benefits" on public.offer_benefits_catalog
  for all using (true) with check (true);

create policy "dev_all_rules" on public.offer_rules
  for all using (true) with check (true);

create policy "dev_all_reservations" on public.reservations
  for all using (true) with check (true);

create policy "dev_all_time_deals" on public.time_deals
  for all using (true) with check (true);

create policy "dev_all_store_menus" on public.store_menus
  for all using (true) with check (true);
