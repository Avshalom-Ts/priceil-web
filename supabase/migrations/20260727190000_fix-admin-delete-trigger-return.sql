-- Fix: allow deleting non-super-admin rows from admin_users.
--
-- The previous trigger function returned NEW by default.
-- In a BEFORE DELETE trigger, returning NEW (NULL) cancels deletion,
-- which caused silent no-op deletes for regular admin rows.

create or replace function public.prevent_last_super_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  super_admin_count int;
begin
  if tg_op = 'DELETE' then
    if old.role = 'super_admin' then
      select count(*) into super_admin_count
      from public.admin_users
      where role = 'super_admin';

      if super_admin_count <= 1 then
        raise exception 'Cannot remove the last super_admin';
      end if;
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
