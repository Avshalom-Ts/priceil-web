# AGENTS.md — priceil-web

Frontend for the PriceIL API — a Next.js app for searching supermarket products and comparing prices across Israeli chains.

---

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- shadcn/ui + Radix UI + Lucide icons
- next-themes for dark/light mode
- API access is centralized in `src/lib/api.ts` and currently uses plain `fetch`

---

## Project structure

```
src/
  app/
    layout.tsx          ← root layout: navbar, dir="rtl", Rubik font
    page.tsx            ← marketing/home page
    search/
      page.tsx          ← basket-first search UX (debounced search, store selector, local basket)
    docs/
      layout.tsx        ← docs shell + sidebar
      page.tsx          ← API overview + limits
      products/page.tsx ← products endpoints docs
      stores/page.tsx   ← stores endpoints docs
      basket/page.tsx   ← basket compare endpoint docs
  lib/
    api.ts              ← all fetch calls to the backend API
  components/
    navbar.tsx
    theme-toggle.tsx
```

---

## Environment / API base URL

`src/lib/api.ts` resolves base URL in this order:

1. `NEXT_PUBLIC_API_URL` (if provided)
2. Dev fallback (`NODE_ENV=development`): `http://177.178.179.14:3000`
3. Prod fallback: `https://api.priceil.dev`

Example local override:

```
NEXT_PUBLIC_API_URL=http://177.178.179.14:3000
```

---

## Backend API

Backend is NestJS REST. Responses are wrapped:

```json
{ "success": true, "data": { ... }, "timestamp": "..." }
```

Error shape:

```json
{ "success": false, "statusCode": 404, "message": "...", "timestamp": "..." }
```

### Key routes used by this frontend

| Route | Purpose |
|-------|---------|
| `GET /products?q=&page=&limit=` | Search products by name |
| `GET /products/search?q=&storeId=&page=&limit=` | Search products inside a specific store |
| `GET /products/:barcode/prices` | Product prices across stores |
| `GET /products/:barcode/prices/:storeId` | Product price in specific store |
| `GET /products/groups?q=&page=&limit=` | Search product groups |
| `GET /products/groups/:id/prices/:storeId` | Cheapest group match in specific store |
| `GET /stores?city=&chain=&page=&limit=` | List/filter stores |
| `GET /stores/chains` | Chains summary |
| `POST /basket/compare` | Basket comparison across stores |

### Other available backend routes (not core FE flow yet)

- `GET /stores/:id`
- `GET /products/:barcode`
- `GET /products/groups/:id`
- `POST /importer/run` (ops/admin flow)
- `GET /health`

### Rate limiting

| Tier | Header | Limit |
|------|--------|-------|
| Free (anonymous) | none | 20 req / 60 s |
| Paid | `x-api-key: <key>` | 500 req / 60 s |

---

## RTL support

App is primarily Hebrew. Root `<html>` must keep:

- `dir="rtl"`
- `lang="he"`

Use directional-safe styles for RTL-aware UX.

---

## Coding conventions

- Keep new pages under `src/app/` (App Router conventions)
- Keep API logic in `src/lib/api.ts` (no inline network calls in page components)
- Prefer existing shadcn/ui primitives before custom components
- Keep the app simple and readable; avoid unnecessary abstraction
- Avoid introducing additional data-fetching libraries unless there is a clear need
- No auth implementation in this phase
- TypeScript strict mode: avoid `any`

---

## Future features (do not implement yet)

- User accounts (Clerk or NextAuth)
- Paid API key purchase (Stripe)
- Full shopping-list optimization UX using product groups + `/basket/compare`
