# API Key Management

## Summary

Full API key management was implemented across the database, backend API routes, and frontend UI.

**Database (Supabase):** Four tables were created — `registered_apps`, `api_keys`, `user_plans`, and `api_usage_monthly`. RLS policies restrict access to each user's own data. New users are automatically provisioned as `free` (5000 req/month) via an `on_auth_user_created` trigger. An `increment_usage` function handles atomic monthly counter updates.

**API Routes (`/api/apps`):** Full CRUD for apps and keys — list, create, delete apps; generate and revoke keys. Raw keys (`pil_<hex>`) are shown once and only the `sha256` hash is stored. All routes enforce authentication, ownership, and tier limits server-side.

**Developers Account UI (`/developers/account`):** Shows current plan badge, monthly usage bar, app list with create/delete, and per-app key management with a one-time copy dialog for new keys. Revoked keys are hidden; only active keys count toward limits.

**Tier limits:** `free` — 1 app, 1 key; `basic` — 3 apps, 2 keys; `premium` — unlimited.

**Backend (`priceil-api`):** — key validation against DB, monthly quota enforcement with `429` on quota exceeded, `increment_usage` calls on valid requests, and async `last_used_at` updates.
