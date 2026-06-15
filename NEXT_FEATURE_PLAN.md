# API Key Management - Current Status

## Done in priceil-web

- Supabase schema migration applied (`registered_apps`, `api_keys`, `user_plans`, `api_usage_monthly`)
- RLS policies applied for user-scoped access
- `increment_usage()` function created
- New user trigger (`on_auth_user_created`) sets default free plan (5,000/month)
- API routes implemented:
  - `GET /api/apps`
  - `POST /api/apps`
  - `DELETE /api/apps/[appId]`
  - `POST /api/apps/[appId]/keys`
  - `DELETE /api/apps/[appId]/keys/[keyId]`
- Account UI implemented in `src/app/developers/account/page.tsx`:
  - plan badge next to account title
  - upgrade button to `/developers/plans`
  - monthly usage bar
  - create/delete app
  - create/revoke key
  - copy-once raw key flow
- Revoked keys are hidden in UI and not counted toward key limits

## Current Tier Rules

These tier plans apply to signed-up users only.

| Tier | Apps | Keys per app | Monthly requests |
|------|------|---------------|------------------|
| Free | 1 | 1 | 5,000 |
| Basic | 3 | 2 | 50,000 |
| Premium | unlimited | unlimited | unlimited |

- Monthly quota is per-user (shared across all apps/keys)
- Anonymous (unsigned) users remain on `20 req/min`, no monthly quota

## Remaining Work (not done yet)

### priceil-api (NestJS) quota guard

1. Validate incoming `x-api-key` by `sha256` hash lookup
2. Check `is_active` and reject revoked keys
3. Read user monthly usage (`api_usage_monthly`) and enforce monthly limit (`user_plans`)
4. Return `429` when quota is exceeded
5. Call `increment_usage(user_id, month_start)` on valid requests
6. Update `last_used_at` asynchronously
7. Keep cache behavior aligned with DB state (do not cache quota rejection)

## Open Decision

- Add per-minute limit for keyed users (recommended):
  - Free: 100/min
  - Basic: higher
  - Premium: highest
