# Auth & API Key Management — Implementation Plan

## Decision: Separate Supabase Project

- priceil-web / priceil-api get their **own Supabase project**, independent of underone.app
- Reasons: different audience (developers vs consumers), cleaner isolation, separate billing/scaling, no coupling

---

## Architecture

```
priceil-web (Next.js)
  └── Supabase Auth (email/password + OAuth)
  └── Supabase DB — api_keys, registered_apps tables

priceil-api (NestJS)
  └── Connects directly to the same Supabase Postgres via connection string
  └── Validates x-api-key on each request (with in-memory cache)
```

---

## Data Model (Supabase)

```sql
-- Managed by Supabase Auth
auth.users

-- Application tables (with RLS)
api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,              -- user-defined label e.g. "My bot"
  key_hash    text not null unique,       -- sha256 of the raw key, never store raw
  is_active   boolean default true,
  created_at  timestamptz default now(),
  last_used_at timestamptz
)

registered_apps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz default now()
)
```

- Raw API key is shown to the user **once** at creation time, never stored
- Store only `sha256(key)` in `key_hash`
- RLS: users can only read/write their own rows

---

## API Key Validation in priceil-api (NestJS)

- On each request with `x-api-key` header:
  1. Hash the incoming key (`sha256`)
  2. Check in-memory Map cache first (TTL ~5 min)
  3. On cache miss → query Supabase Postgres: `SELECT is_active FROM api_keys WHERE key_hash = $1`
  4. Update `last_used_at` asynchronously (fire-and-forget, don't block the request)
- Cache miss only on first use or after TTL expires → negligible latency impact

---

## priceil-web Pages to Build

| Page | Path | Description |
|------|------|-------------|
| Sign in / Sign up | `/sign-in` | Supabase Auth UI or custom form |
| Dashboard | `/dashboard` | List API keys + registered apps |
| Create key | `/dashboard/keys/new` | Generate key, show raw once |
| Key detail | `/dashboard/keys/:id` | Usage stats, revoke |

---

## Environment Variables Needed

**priceil-web:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**priceil-api:**
```
SUPABASE_DB_URL=          # direct Postgres connection string
```

---

## Implementation Order

1. Create Supabase project
2. Run schema migrations (api_keys, registered_apps + RLS policies)
3. Add Supabase client to priceil-web (`@supabase/ssr`)
4. Build sign-in / sign-up pages
5. Build dashboard (list keys, create, revoke)
6. Add API key validation guard to priceil-api
7. Wire up `last_used_at` background update
