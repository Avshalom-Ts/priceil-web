-- ============================================================
-- Migration: admin-management-foundation
-- Adds role-based admin access, user access-state tracking,
-- and audit logging for admin actions.
-- ============================================================

-- ---------------------------------------------------------------
-- 1. admin_users
-- ---------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.admin_users enable row level security;

create policy "users_select_own_admin_role"
  on public.admin_users for select
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- 2. user_access_state
-- ---------------------------------------------------------------
create table if not exists public.user_access_state (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  status      text not null check (status in ('active', 'blocked', 'deleted_soft')),
  reason      text,
  changed_by  uuid references auth.users(id),
  changed_at  timestamptz not null default now()
);

alter table public.user_access_state enable row level security;

create policy "users_select_own_access_state"
  on public.user_access_state for select
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- 3. admin_audit_log
-- ---------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id             uuid primary key default gen_random_uuid(),
  actor_user_id  uuid references auth.users(id),
  action         text not null,
  target_user_id uuid references auth.users(id),
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create index if not exists idx_admin_audit_log_created_at
  on public.admin_audit_log(created_at desc);

create index if not exists idx_admin_audit_log_target_user_id
  on public.admin_audit_log(target_user_id);


-- ---------------------------------------------------------------
-- 4. guard: prevent removing last super_admin
-- ---------------------------------------------------------------
create or replace function public.prevent_last_super_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  super_admin_count int;
begin
  if (tg_op = 'DELETE' and old.role = 'super_admin') then
    select count(*) into super_admin_count
    from public.admin_users
    where role = 'super_admin';

    if super_admin_count <= 1 then
      raise exception 'Cannot remove the last super_admin';
    end if;

    return old;
  end if;

  if (
    tg_op = 'UPDATE'
    and old.role = 'super_admin'
    and new.role <> 'super_admin'
  ) then
    select count(*) into super_admin_count
    from public.admin_users
    where role = 'super_admin';

    if super_admin_count <= 1 then
      raise exception 'Cannot demote the last super_admin';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_last_super_admin_delete on public.admin_users;
create trigger trg_prevent_last_super_admin_delete
  before delete on public.admin_users
  for each row execute procedure public.prevent_last_super_admin_removal();

drop trigger if exists trg_prevent_last_super_admin_update on public.admin_users;
create trigger trg_prevent_last_super_admin_update
  before update on public.admin_users
  for each row execute procedure public.prevent_last_super_admin_removal();
