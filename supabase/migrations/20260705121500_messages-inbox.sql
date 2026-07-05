-- ============================================================
-- Migration: messages-inbox
-- Adds user-to-admin messages inbox support.
-- ============================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  subject text not null,
  content text not null,
  status text not null default 'unread' check (status in ('unread', 'read')),
  read_at timestamptz,
  read_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_messages_status_created_at
  on public.messages(status, created_at desc);

create index if not exists idx_messages_user_id_created_at
  on public.messages(user_id, created_at desc);

create or replace function public.set_messages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_messages_updated_at on public.messages;
create trigger trg_messages_updated_at
before update on public.messages
for each row execute procedure public.set_messages_updated_at();

alter table public.messages enable row level security;

create policy "users_insert_own_messages"
  on public.messages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users_select_own_messages"
  on public.messages
  for select
  to authenticated
  using (auth.uid() = user_id);