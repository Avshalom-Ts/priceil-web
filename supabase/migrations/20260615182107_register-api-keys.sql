-- ============================================================
-- Migration: register-api-keys
-- Creates tables for per-app API key management with monthly
-- quota tracking and per-user plan limits.
-- ============================================================

-- ---------------------------------------------------------------
-- 1. registered_apps
-- ---------------------------------------------------------------
create table if not exists public.registered_apps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

alter table public.registered_apps enable row level security;

create policy "users_select_own_apps"
  on public.registered_apps for select
  using (auth.uid() = user_id);

create policy "users_insert_own_apps"
  on public.registered_apps for insert
  with check (auth.uid() = user_id);

create policy "users_delete_own_apps"
  on public.registered_apps for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- 2. api_keys
-- ---------------------------------------------------------------
create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  app_id       uuid not null references public.registered_apps(id) on delete cascade,
  name         text not null,
  key_hash     text not null unique,   -- sha256 of the raw key, raw key never stored
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.api_keys enable row level security;

create policy "users_select_own_keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "users_insert_own_keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_keys"
  on public.api_keys for update
  using (auth.uid() = user_id);

create policy "users_delete_own_keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- 3. user_plans
--    One row per user. Stores the active plan and its monthly
--    request limit. -1 means unlimited (premium).
-- ---------------------------------------------------------------
create table if not exists public.user_plans (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  plan          text not null default 'free'
                  check (plan in ('free', 'basic', 'premium')),
  monthly_limit int  not null default 5000,  -- -1 = unlimited
  updated_at    timestamptz not null default now()
);

alter table public.user_plans enable row level security;

-- Users can read their own plan; only service role may update it.
create policy "users_select_own_plan"
  on public.user_plans for select
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- 4. api_usage_monthly
--    One row per (user, month). Shared pool across all keys/apps.
--    year_month is always the first day of the month (e.g. 2026-06-01).
-- ---------------------------------------------------------------
create table if not exists public.api_usage_monthly (
  user_id       uuid    not null references auth.users(id) on delete cascade,
  year_month    date    not null,
  request_count int     not null default 0,
  primary key (user_id, year_month)
);

alter table public.api_usage_monthly enable row level security;

-- Users can read their own usage; only service role may insert/update.
create policy "users_select_own_usage"
  on public.api_usage_monthly for select
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- 5. increment_usage()
--    Called by priceil-api (service role) on every valid request.
--    Atomically increments the counter; inserts the row if it
--    doesn't exist yet for the current month.
-- ---------------------------------------------------------------
create or replace function public.increment_usage(
  p_user_id   uuid,
  p_year_month date
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.api_usage_monthly (user_id, year_month, request_count)
  values (p_user_id, p_year_month, 1)
  on conflict (user_id, year_month)
  do update set request_count = api_usage_monthly.request_count + 1;
$$;


-- ---------------------------------------------------------------
-- 6. handle_new_user()  +  trigger
--    Automatically inserts a free-tier row in user_plans when a
--    new user signs up via Supabase Auth.
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_plans (user_id, plan, monthly_limit)
  values (new.id, 'free', 5000)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
