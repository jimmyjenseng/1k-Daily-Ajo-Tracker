-- ============================================================
--  Ajo Tracker — Supabase Schema (safe to re-run)
-- ============================================================

-- 1. payments table
create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  date       text        not null,
  hand_no    integer     not null,
  amount     integer     not null,
  note       text,
  created_at timestamptz not null default now()
);

-- 2. settings table
create table if not exists public.settings (
  key   text primary key,
  value jsonb not null
);

-- 3. Seed settings (skip if already exist)
insert into public.settings (key, value)
values ('payout_order', '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]'::jsonb)
on conflict (key) do nothing;

insert into public.settings (key, value)
values ('fines', '{}'::jsonb)
on conflict (key) do nothing;

insert into public.settings (key, value)
values ('defaults', '{}'::jsonb)
on conflict (key) do nothing;

insert into public.settings (key, value)
values ('password', '"3914"'::jsonb)
on conflict (key) do nothing;

-- 4. RLS — drop first so re-runs never fail
alter table public.payments enable row level security;
alter table public.settings  enable row level security;

drop policy if exists "anon full access payments" on public.payments;
drop policy if exists "anon full access settings"  on public.settings;

create policy "anon full access payments"
  on public.payments for all to anon
  using (true) with check (true);

create policy "anon full access settings"
  on public.settings for all to anon
  using (true) with check (true);

-- 5. Real-time (safe to run even if already added)
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.settings;
