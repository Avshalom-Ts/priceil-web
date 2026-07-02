# Admin Management Plan

## Goal

Build a dedicated admin console for platform management, separate from user self-service pages, with strict role-based authorization, user statistics visibility, and safe bootstrap of the first super admin.

## Route Decision

- Canonical admin route: `/admin`
- Suggested sub-routes:
  - `/admin/users`
  - `/admin/admins`
  - `/admin/audit`
  - `/admin/stats`
  - `/admin/settings`
- Keep `/developers/account` as user self-service only (apps/keys for the signed-in user).

## Role Model

### Roles

- `super_admin`
  - Full access to all admin features
  - Can grant/revoke admin roles
  - Can perform destructive global actions
- `admin`
  - Can manage regular users (block/unblock/moderation)
  - Cannot manage `super_admin` assignments
- `regular_user`
  - No admin access

### User Access State

Introduce user status control for platform enforcement:

- `active`
- `blocked`
- `deleted_soft`

Store reason, actor, and timestamps for all state changes.

## First Super Admin Bootstrap (Approved)

Use deterministic SQL seed by trusted email.

1. Ensure the target user exists in `auth.users`.
1. Insert their `id` into `admin_users` as `super_admin`.
1. Make seed idempotent with `ON CONFLICT`.
1. Record bootstrap action in audit log as `bootstrap_system`.

## Safety Constraints

- Never allow removing the last `super_admin`.
- Never allow self-demotion if it leaves zero `super_admin` users.
- Require `super_admin` for role mutation endpoints.
- Enforce authorization server-side only.

## Architecture

### Database (Supabase)

Add a new migration with:

- `admin_users` table
  - `user_id uuid primary key references auth.users(id) on delete cascade`
  - `role text not null check (role in ('admin', 'super_admin'))`
  - `created_at timestamptz not null default now()`
  - `created_by uuid null references auth.users(id)`
- `user_access_state` table
  - `user_id uuid primary key references auth.users(id) on delete cascade`
  - `status text not null check (status in ('active', 'blocked', 'deleted_soft'))`
  - `reason text null`
  - `changed_by uuid null references auth.users(id)`
  - `changed_at timestamptz not null default now()`
- `admin_audit_log` table
  - `id uuid primary key default gen_random_uuid()`
  - `actor_user_id uuid null references auth.users(id)`
  - `action text not null`
  - `target_user_id uuid null references auth.users(id)`
  - `metadata jsonb not null default '{}'::jsonb`
  - `created_at timestamptz not null default now()`

### Authorization Layers

1. Middleware guard for `/admin/:path*`.
1. API guard for all `/api/admin/*` handlers.
1. Shared helper functions: `requireAdmin()`, `requireSuperAdmin()`.
1. Defense in depth: both middleware and handlers must enforce role checks.
1. Statistics access policy:
1. Global statistics: `admin` and `super_admin`.
1. Per-user full statistics: `super_admin` only.

### Admin Statistics Scope

Global statistics in `/admin/stats`:

- total users
- active users
- blocked users
- total requests this month
- plan distribution (`free`, `basic`, `premium`)

Per-user statistics:

- user monthly request totals
- app count
- active key count
- last key usage timestamp

## API Surface (Admin)

1. `GET /api/admin/users`
1. `PATCH /api/admin/users/:userId/status`
1. `DELETE /api/admin/users/:userId` (soft delete by default)
1. `GET /api/admin/admins`
1. `POST /api/admin/admins`
1. `PATCH /api/admin/admins/:userId`
1. `DELETE /api/admin/admins/:userId`
1. `GET /api/admin/audit`
1. `GET /api/admin/stats/global`
1. `GET /api/admin/stats/users/:userId`

## UI/UX Scope

Build admin pages for:

1. Users list/search and details
1. Block/unblock actions
1. Soft-delete flow and optional hard-delete flow
1. Admin role management
1. Audit log explorer
1. Global statistics dashboard (request volume and usage trends)
1. Per-user statistics (API calls, key usage, plan consumption)

All destructive actions require explicit confirmation.

## Implementation Steps (Execution Runbook)

1. Create a new Supabase migration in `supabase/migrations` that adds `admin_users`, `user_access_state`, and `admin_audit_log`.
1. Enable RLS on new tables and add policies so only service role or approved admin server code can mutate them.
1. Add bootstrap SQL for first super admin by email (idempotent upsert).
1. Create shared authz helpers in `src/lib` (for example `src/lib/admin-auth.ts`).
1. Extend `src/proxy.ts` matcher to include `/admin/:path*` and check session + role.
1. Add API route group under `src/app/api/admin`.
1. Implement role guards in every admin handler (`requireAdmin` or `requireSuperAdmin`).
1. Implement users management endpoints (`list`, `status update`, `soft delete`).
1. Implement admins management endpoints (`list`, `grant`, `promote`, `revoke`) with last-super-admin protection.
1. Implement audit endpoint and write audit records on every admin mutation.
1. Implement stats endpoints:
1. `GET /api/admin/stats/global` for aggregate metrics.
1. `GET /api/admin/stats/users/:userId` for per-user metrics.
1. Build admin page tree under `src/app/(site)/admin` with pages: `page.tsx`, `users/page.tsx`, `admins/page.tsx`, `audit/page.tsx`, `stats/page.tsx`.
1. Connect UI pages to admin APIs with server-side fetch and clear empty/error states.
1. Add confirmation dialogs for destructive actions and inline success/error feedback.
1. Add tests for role checks, last-super-admin protection, and stats visibility rules.
1. Deploy to staging, seed first super admin, run verification checklist, then promote to production.

## Verification Checklist

1. Anonymous user cannot access `/admin` or `/api/admin/*`.
1. Regular signed-in user gets `403` for admin routes/endpoints.
1. `admin` can perform allowed user-management actions only.
1. `super_admin` can perform role and destructive operations.
1. Last-super-admin guard blocks unsafe demotion/removal.
1. Bootstrap SQL is idempotent (safe to run twice).
1. Every admin mutation writes a valid audit log row.
1. Global stats endpoint is accessible to `admin` and `super_admin`.
1. Per-user stats endpoint is accessible only to `super_admin`.

## Notes

- This plan intentionally separates platform administration from developer self-service.
- Existing `/developers/account` remains unchanged in purpose.
