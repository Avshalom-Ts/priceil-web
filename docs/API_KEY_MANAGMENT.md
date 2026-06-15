# API Key Management - Implemented Summary

This document summarizes what is already implemented from the plan.

## Status Overview

- Phase 1 (Supabase schema): Done
- Phase 2 (Next.js API routes): Done
- Phase 3 (Account page UI): Done
- Phase 4 (priceil-api monthly quota guard): Pending in the backend repo

## Implemented: Database (Supabase)

Migration applied: `supabase/migrations/20260615182107_register-api-keys.sql`

Created tables and policies:
- `registered_apps` with RLS (users can manage only their own apps)
- `api_keys` with RLS and FK to `registered_apps` (`ON DELETE CASCADE`)
- `user_plans` with allowed plans (`free`, `basic`, `premium`)
- `api_usage_monthly` for monthly per-user request counting

Created database functions/triggers:
- `increment_usage(p_user_id, p_year_month)` for atomic monthly counter increment
- `handle_new_user()` + `on_auth_user_created` trigger
  - New users are auto-created as `free` with monthly limit `5000`

## Implemented: API Routes (priceil-web)

Implemented routes:
- `GET /api/apps`
  - Returns: `plan`, `usage`, and user apps with keys
  - Filters keys to active keys in response (`api_keys.is_active = true`)
- `POST /api/apps`
  - Creates app
  - Enforces plan app limits
- `DELETE /api/apps/[appId]`
  - Deletes app owned by user
  - Keys are hard-deleted by DB cascade
- `POST /api/apps/[appId]/keys`
  - Generates raw key once (`pil_<hex>`)
  - Stores only `sha256(raw_key)` in DB
  - Enforces per-app key limit using active keys only
- `DELETE /api/apps/[appId]/keys/[keyId]`
  - Revokes key (`is_active = false`), not hard delete

Security in routes:
- All routes require authenticated user
- Ownership checks on every app/key mutation
- Tier limit checks are server-side

## Implemented: UI (Developers Account Page)

Page: `src/app/developers/account/page.tsx`

Implemented UX:
- Account title with current plan badge (for example: `חינם`)
- Upgrade button linking to `/developers/plans`
- Monthly usage bar (`used / monthly_limit`)
- App list with create/delete app actions
- Key list per app with revoke action
- Create key dialog that shows raw key once and copy button
- Revoked keys are hidden from UI (only active keys are displayed)
- Limit messages for app/key limits

## Current Tier Logic in Web Layer

- `free`: 1 app, 1 key per app
- `basic`: 3 apps, 2 keys per app
- `premium`: unlimited apps and keys

## Important Behaviors (Implemented)

- Revoking a key frees the slot for new key creation (active keys only are counted)
- Deleting an app removes all keys under that app (cascade delete)
- Monthly usage tracking is per-user (shared across all apps/keys)
- Deleting/recreating apps or keys does not reset monthly usage count

## Pending From Plan

- Phase 4 in `priceil-api` (NestJS) is not implemented here yet:
  - Validate key against DB + cache
  - Enforce monthly limit using `api_usage_monthly`
  - Return `429` when monthly quota exceeded
  - Call `increment_usage` on valid requests
  - Update `last_used_at` asynchronously
