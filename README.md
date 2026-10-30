# PriceIL Web

Hebrew-first frontend for PriceIL, a platform for searching supermarket products and comparing prices across Israeli chains. This repository contains the Next.js website, shopping-list experience, developer portal, and administrative tools. The NestJS product and pricing API runs separately.

## Features

- Product search by name or barcode, including searches within a selected store.
- Shopping list with quantities, store-specific prices, and browser-local persistence.
- Store filtering and optional location-based store discovery using browser geolocation and BigDataCloud reverse geocoding.
- Developer documentation and interactive API examples.
- Google sign-in through Supabase Auth, developer accounts, registered apps, API key creation/revocation, and usage information.
- Admin tools for users, API keys, roles, usage statistics, audit history, and contact messages/replies.
- Contact form, account message inbox, privacy and terms pages, cookie notice, and light/dark themes.
- Hebrew RTL layout (`lang="he"`, `dir="rtl"`) and Rubik typography.

The shopping list currently prices items for a selected store. Full basket optimization across stores and payment processing are not implemented.

## Technology

- Next.js 16.2.1 App Router and React 19.2.4, with React Compiler enabled.
- TypeScript in strict mode.
- Tailwind CSS v4, shadcn/ui, Radix UI, and Lucide icons.
- Supabase Auth/Postgres with browser, server, and privileged server clients.
- `next-themes` for theme switching.
- Plain `fetch` helpers in `src/lib/api.ts` for product/store data, backed by Next.js proxy routes.
- pnpm with a committed lockfile; Docker and Docker Compose for container deployment.

## Local setup

### Prerequisites

- A Node.js version supported by Next.js 16 (20.9 or newer).
- pnpm installed and available on your PATH.
- A running PriceIL backend, or access to a hosted instance.
- A Supabase project for authentication, developer accounts, messaging, and administration.

### Install and configure

From the repository root:

```bash
pnpm install --frozen-lockfile
```

Create `.env.local` manually; the repository does not include an environment template:

```dotenv
# Public Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-only privileged credential
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# PriceIL backend (example: a separate local backend on port 3001)
API_PROXY_TARGET=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# Optional server-only key attached to proxied backend requests
PRICEIL_APP_API_KEY=your-priceil-app-api-key
```

Replace the placeholders with your environment's values. Keep `.env.local` out of source control. `SUPABASE_SERVICE_ROLE_KEY` and `PRICEIL_APP_API_KEY` must remain server-only; never give them a `NEXT_PUBLIC_` prefix.

Start the frontend:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The backend must use a different port when it runs on the same host. Restart the dev server after changing environment variables.

### Environment reference

| Variable                        | Purpose                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL, used by browser and server clients.                                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key; database access is governed by RLS.                                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Privileged server access for administrative operations, messaging, and account deletion.               |
| `API_PROXY_TARGET`              | Preferred upstream for `/backend-api/*` and developer route discovery.                                 |
| `NEXT_PUBLIC_API_URL`           | Fallback upstream for `/backend-api/*`; also configures the separate `/api/proxy` playground endpoint. |
| `PRICEIL_APP_API_KEY`           | Optional `x-api-key` attached server-side by both API proxies.                                         |

Set both API URL variables to the same backend if the shopping list and documentation playground should use the same instance. The current defaults differ:

- `/backend-api/*`: `API_PROXY_TARGET` → `NEXT_PUBLIC_API_URL` → `http://localhost:3000` in development or `https://priceil.dev` in production.
- `/api/proxy`: `NEXT_PUBLIC_API_URL` → `https://api.priceil.dev`.
- Developer route discovery: `API_PROXY_TARGET` → `NEXT_PUBLIC_API_URL` → `https://api.priceil.dev`.

Explicit configuration avoids the development proxy targeting the frontend itself or production requests going to an unintended host.

## Supabase setup

1. Create or select a Supabase project and populate the three Supabase environment variables above.
2. Apply all SQL migrations in `supabase/migrations/` in filename order. These define registered apps, hashed API keys, plans, monthly usage, admin roles, audit records, account access state, and message threads/replies.
3. Enable the Google provider in Supabase Auth and configure its OAuth credentials.
4. Configure Supabase Auth's Site URL and allowed redirect URLs for your environments, including `http://localhost:3000/auth/callback` for local development and the corresponding production callback URL. The Google provider callback uses your Supabase project's Auth callback URL.
5. Sign in once to create the initial user account. For admin access, follow the [admin bootstrap runbook](docs/ADMIN_BOOTSTRAP_RUNBOOK.md) to grant the first trusted `super_admin` role.

For a hosted project, the bundled CLI can apply pending migrations after you authenticate and link the intended project:

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref YOUR_PROJECT_REF
pnpm exec supabase db push
```

Confirm the linked project before applying migrations. The SQL migrations can also be applied through the Supabase SQL Editor in order.

`/developers/account` and `/admin` require authentication. Admin pages and API handlers also check role membership; role management requires `super_admin`. Ordinary sign-in does not grant admin access.

## Commands

| Command                  | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `pnpm dev`               | Start the development server.                    |
| `pnpm build`             | Create the production build.                     |
| `pnpm start`             | Serve an existing production build on port 3000. |
| `pnpm lint`              | Run ESLint.                                      |
| `pnpm exec tsc --noEmit` | Check TypeScript without emitting files.         |

There is currently no automated test script. For code changes, run lint, TypeScript checks, and an appropriate production build, then exercise the affected screens. Builds use `next/font/google` for Rubik and may require access to Google's font servers.

## Routes and source layout

| URL                              | Purpose                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `/`                              | Public home page.                                                                         |
| `/shopping-list`                 | Product search, store selection, and local shopping list.                                 |
| `/developers`                    | Developer landing page and API playground.                                                |
| `/developers/docs`               | API overview, with `/products`, `/stores`, `/chains`, and `/basket` subpages.             |
| `/developers/plans`              | API plan information.                                                                     |
| `/developers/account`            | Signed-in developer account, apps, API keys, and usage.                                   |
| `/developers/account/messages`   | Account message inbox and thread details.                                                 |
| `/admin`                         | Protected administration area, including users, admins, keys, stats, audit, and messages. |
| `/contact`, `/privacy`, `/terms` | Contact form and legal pages.                                                             |
| `/auth/callback`                 | Supabase OAuth code exchange.                                                             |

```text
src/
  app/
    layout.tsx                 # Root RTL layout, Rubik, navbar, theme, cookie notice
    (site)/                    # Route group; does not add a URL segment
      page.tsx                 # Home page
      developers/              # Portal, docs, plans, account, messages
      admin/                   # Admin interface
      contact/ privacy/ terms/
    shopping-list/             # Shopping-list interface
    auth/callback/route.ts     # OAuth callback
    api/                       # Account, apps/keys, admin, contact, backend proxies
  components/
    ui/                        # Shared UI primitives
    shopping-list/             # Toolbar, basket, and search results
    docs/                      # Documentation UI
  lib/
    api.ts                     # Product/store API types and fetch helpers
    shopping-list.ts           # Basket types, city matching, distance helpers
    admin-auth.ts              # Server-side admin guards
    supabase/                  # Browser/server/admin clients and user helpers
  proxy.ts                     # Protected-route auth checks
supabase/
  config.toml
  migrations/                  # Versioned schema, policies, functions, and triggers
docs/                          # Operational runbooks and API reference material
```

## Backend integration

Product/store helpers in `src/lib/api.ts` call the same-origin `/backend-api` prefix. `next.config.ts` rewrites this to `src/app/api/backend-api/[...path]/route.ts`, which forwards GET/POST requests to the configured backend and adds the app API key on the server. Interactive documentation uses the separate `/api/proxy` handler.

Key product/store routes currently called by the frontend helpers:

| Backend route                                 | Purpose                                            |
| --------------------------------------------- | -------------------------------------------------- |
| `GET /products?q=&page=&limit=`               | Search products.                                   |
| `GET /products/:storeId/like?q=&page=&limit=` | Search products within a store.                    |
| `GET /products/:barcode/prices`               | Get prices across stores.                          |
| `GET /products/:barcode/prices/:storeId`      | Get a product's price in one store.                |
| `GET /stores?city=&chain=&limit=`             | List/filter stores; the helper requests up to 500. |
| `GET /stores/chains`                          | Get chain summaries.                               |

The backend uses response envelopes such as:

```json
{
  "success": true,
  "data": {},
  "timestamp": "..."
}
```

```json
{
  "success": false,
  "statusCode": 404,
  "message": "...",
  "timestamp": "..."
}
```

The shared fetch helper unwraps `data` and throws on non-success HTTP status codes. Rate limits, API-key validation, and quota enforcement belong to the backend; check its deployed configuration when diagnosing `429` responses. Browser-local shopping lists are separate from Supabase developer account data and do not sync across devices.

## Production deployment

### Node.js

Configure the environment before building, then run:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Next.js embeds `NEXT_PUBLIC_*` values into browser bundles at build time. Rebuild after changing public Supabase or API settings. Keep server-only credentials available to the running server.

### Docker Compose

The included multi-stage Dockerfile installs with pnpm, builds Next.js, and serves port 3000 as a non-root user. Compose loads `.env.local` into the running container:

```bash
docker compose up -d --build app
docker compose ps
docker compose logs -f app
```

The service is `app`, the container name is `priceil-web`, and the host port is `3000`.

**Build configuration:** Compose's `env_file` supplies runtime variables, not Docker build arguments. The current Dockerfile copies the build context, and `.dockerignore` currently excludes only `node_modules`. A local `.env.local` is therefore copied into the builder and read by `pnpm build`; public values are embedded in the output. Use a controlled build context and account for this behavior when handling secrets or building in CI. Runtime variables alone cannot replace public values in an already-built browser bundle.

For push-to-deploy infrastructure, see the [bare Git deployment guide](docs/DEPLOY_BARE_REPO.md). Use the complete environment settings above alongside that guide.

## Development conventions and further documentation

Keep App Router pages under `src/app/`, product/store API helpers in `src/lib/api.ts`, and shared UI in `src/components/`. Preserve Hebrew RTL semantics and use directional-safe styles. Prefer existing UI primitives and avoid unnecessary abstractions or new fetching libraries. Follow [AGENTS.md](AGENTS.md) for repository conventions; some of its feature descriptions predate the current implementation.

- [API key management](docs/API_KEY_MANAGMENT.md)
- [Admin bootstrap and recovery](docs/ADMIN_BOOTSTRAP_RUNBOOK.md)
- [Bare Git deployment](docs/DEPLOY_BARE_REPO.md)
- [Backend routes](docs/api-priceil-app-docs/routes.md)
- [Backend response examples](docs/api-priceil-app-docs/responses.md)
- [Backend shopping-list integration guide](docs/api-priceil-app-docs/shopping-list-guide.md)
