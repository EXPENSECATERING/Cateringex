-- ==============================================================================
-- CATERING & SETTLEMENT MANAGER - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create Events Table (Bookings / Orders)
create table if not exists public.events (
  id text primary key,
  client_name text not null,
  date text not null,
  total_amount numeric not null default 0,
  brought_by text not null, -- 'ME' or 'BROTHER'
  notes text default '',
  created_at timestamptz default now()
);

-- 2. Create Expenses Table (Daily Raw Materials, Staff, Gas, etc.)
create table if not exists public.expenses (
  id text primary key,
  title text not null,
  category text not null default 'General',
  amount numeric not null default 0,
  paid_by text not null, -- 'ME' or 'BROTHER'
  event_id text default 'GENERAL',
  date text not null,
  created_at timestamptz default now()
);

-- 3. Create Settlements Table (History of closed cycles)
create table if not exists public.settlements (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 4. Create App State Table (Carry Forward, Active Cycle Month, Archives)
create table if not exists public.app_state (
  key text primary key, -- 'carry_forward', 'active_cycle_month', 'archived_settlements'
  value jsonb not null,
  updated_at timestamptz default now()
);

-- 5. Audit Trail & Edit Tracking Columns
alter table public.expenses add column if not exists last_edited_by text;
alter table public.expenses add column if not exists last_edited_at text;
alter table public.expenses add column if not exists edit_reason text;
alter table public.expenses add column if not exists edit_history jsonb default '[]'::jsonb;

alter table public.events add column if not exists last_edited_by text;
alter table public.events add column if not exists last_edited_at text;
alter table public.events add column if not exists edit_reason text;
alter table public.events add column if not exists edit_history jsonb default '[]'::jsonb;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - Shared Access for 2 Partners
-- ==============================================================================
alter table public.events enable row level security;
drop policy if exists "Allow all on events" on public.events;
create policy "Allow all on events" on public.events for all using (true) with check (true);

alter table public.expenses enable row level security;
drop policy if exists "Allow all on expenses" on public.expenses;
create policy "Allow all on expenses" on public.expenses for all using (true) with check (true);

alter table public.settlements enable row level security;
drop policy if exists "Allow all on settlements" on public.settlements;
create policy "Allow all on settlements" on public.settlements for all using (true) with check (true);

alter table public.app_state enable row level security;
drop policy if exists "Allow all on app_state" on public.app_state;
create policy "Allow all on app_state" on public.app_state for all using (true) with check (true);

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION (Instant phone-to-phone sync)
-- ==============================================================================
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.settlements;
alter publication supabase_realtime add table public.app_state;
