-- ============================================================
-- Migration: messages-replies
-- Follow-up migration to keep the base messages migration immutable.
-- Adds reply fields used by the user account inbox and admin reply flow.
-- ============================================================

alter table public.messages
  add column if not exists reply_content text;

alter table public.messages
  add column if not exists replied_at timestamptz;

alter table public.messages
  add column if not exists replied_by uuid references auth.users(id);