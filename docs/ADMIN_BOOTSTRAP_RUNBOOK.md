# Admin Bootstrap Runbook

This document explains how to create the first `super_admin` user and safely repeat the process later if needed.

## Purpose

Use this runbook to:

- bootstrap the first admin after a fresh environment setup
- recover access if all admins were removed by mistake
- repeat the process in staging/production with the same safe steps

## Preconditions

1. The admin schema migration is already applied (at minimum `admin_users` and `admin_audit_log` tables exist).
2. The target person already has a valid account in Supabase Auth (`auth.users`).
3. You have secure operator access to Supabase SQL Editor or `supabase db` execution flow.
4. You know the exact email of the person who should become `super_admin`.

## Where the trusted email comes from

The trusted email must come from an operator-owned source, not from frontend input.

Allowed sources:

- platform ops runbook
- secure password manager record
- CI/CD secret used only for one-time bootstrap scripts

Not allowed:

- `NEXT_PUBLIC_*` variables
- user-provided request body from frontend
- any client-side form

## Step 1: Confirm the user exists

Run in Supabase SQL Editor:

```sql
select id, email, created_at
from auth.users
where email = 'admin@example.com';
```

Expected result: exactly one row.

If zero rows: ask the person to sign in once first, then run again.

## Step 2: Idempotent insert as super admin

Run:

```sql
insert into public.admin_users (user_id, role, created_by)
select u.id, 'super_admin', null
from auth.users u
where u.email = 'admin@example.com'
on conflict (user_id)
do update set role = excluded.role;
```

Why this is safe:

- If user is not admin yet, they are added.
- If user already exists in `admin_users`, role is updated to `super_admin`.
- Running multiple times does not duplicate rows.

## Step 3: Write bootstrap audit record

Run:

```sql
insert into public.admin_audit_log (
  actor_user_id,
  action,
  target_user_id,
  metadata
)
select
  null,
  'bootstrap_super_admin',
  u.id,
  jsonb_build_object(
    'source', 'bootstrap_runbook',
    'email', u.email,
    'note', 'initial super admin seed'
  )
from auth.users u
where u.email = 'admin@example.com';
```

## Step 4: Verify role assignment

Run:

```sql
select
  u.email,
  a.role,
  a.created_at
from public.admin_users a
join auth.users u on u.id = a.user_id
where u.email = 'admin@example.com';
```

Expected result: one row with `role = super_admin`.

## Step 5: Verify application access

1. Sign in as that user.
2. Open `/admin`.
3. Confirm admin pages load.
4. Call `GET /api/admin/admins` and confirm status 200.

## Repeat / Recovery Procedure

Use the exact same steps for recovery.

Common scenarios:

- No admin can access `/admin`: rerun this runbook for a trusted account.
- Admin has wrong role: rerun Step 2 to force role to `super_admin`.

## Optional: Promote additional admins

After first login through `/admin`, use admin UI for future grants/revokes.

If SQL is required:

```sql
insert into public.admin_users (user_id, role, created_by)
select u.id, 'admin', x.id
from auth.users u
cross join (
  select id from auth.users where email = 'superadmin@example.com' limit 1
) x
where u.email = 'another-admin@example.com'
on conflict (user_id)
do update set role = excluded.role, created_by = excluded.created_by;
```

## Safety rules (must enforce in app logic)

1. Never allow removing the last `super_admin`.
2. Never allow self-demotion if it leaves zero `super_admin` users.
3. Only `super_admin` can change admin roles.
4. Every admin mutation must write `admin_audit_log`.

## Rollback

If wrong user was promoted:

```sql
delete from public.admin_users
where user_id = (
  select id from auth.users where email = 'wrong-user@example.com'
);
```

Then add an audit record for the reversal.

## Post-bootstrap cleanup

1. If you used a temporary env var (for script-based bootstrap), remove it.
2. Do not keep reusable bootstrap credentials in source control.
3. Keep this file as the canonical process document.

## Quick checklist

1. Migration applied
2. Trusted email verified
3. Idempotent seed executed
4. Audit row written
5. `/admin` access verified
6. Safety rules validated
