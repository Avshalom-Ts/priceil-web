# Admin Management Plan

## Goal

Build a dedicated admin console for platform management, separate from user self-service pages, with strict role-based authorization and safe bootstrap of the first super admin.

## Route Decision

- Canonical admin route: `/admin`
- Suggested sub-routes:
  - `/admin/users`
  - `/admin/admins`
  - `/admin/audit`
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
- regular user
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
2. Insert their `id` into `admin_users` as `super_admin`.
3. Make seed idempotent with `ON CONFLICT`.
4. Record bootstrap action in audit log as `bootstrap_system`.

## Safety Constraints

- Never allow removing the last `super_admin`.
- Never allow self-demotion if it leaves zero `super_admin` users.
- Require `super_admin` for role mutation endpoints.
- Enforce authorization server-side only.

## Architecture

### Database (Supabase)

Add a new migration with:

- `admin_users` table
  - `user_id uuid primary key references auth.users(id)`
  - `role text check (role in ('admin', 'super_admin'))`
  - metadata/timestamps
- `user_access_state` table
  - one row per user with current status
  - reason + actor + changed timestamp
- `admin_audit_log` table
  - action, actor, target, reason
  - optional before/after json snapshots
  - created timestamp

### Authorization Layers

1. Middleware guard for `/admin/:path*`.
2. API guard for all `/api/admin/*` handlers.
3. Helper functions:
  - `requireAdmin()`
  - `requireSuperAdmin()`
4. Defense in depth: both middleware and handlers must enforce role checks.

### UI/UX Scope

Build admin pages for:

1. Users list/search and details
2. Block/unblock actions
3. Soft-delete flow and optional hard-delete flow
4. Admin role management
5. Audit log explorer

All destructive actions require explicit confirmation.

## Implementation Phases

1. Add schema and constraints migration (`admin_users`, `user_access_state`, `admin_audit_log`).
2. Add one-time bootstrap SQL for first `super_admin`.
3. Add shared authorization helpers in server layer.
4. Protect `/admin` in middleware.
5. Implement `/api/admin/*` endpoints with role enforcement.
6. Build admin route tree and pages under `/admin`.
7. Add audit logging to all admin mutations.
8. Run staging verification and production rollout runbook.

## Verification Checklist

1. Anonymous user cannot access `/admin` or `/api/admin/*`.
2. Regular signed-in user gets `403` for admin routes/endpoints.
3. `admin` can perform allowed user-management actions only.
4. `super_admin` can perform role and destructive operations.
5. Last-super-admin guard blocks unsafe demotion/removal.
6. Bootstrap SQL is idempotent (safe to run twice).
7. Every admin mutation writes a valid audit log row.

## Notes

- This plan intentionally separates platform administration from developer self-service.
- Existing `/developers/account` remains unchanged in purpose.
