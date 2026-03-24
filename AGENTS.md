# AGENTS.md — priceil-web

Frontend for the **PriceIL API** — a Next.js app that lets users search and compare supermarket product prices across Israeli chains.

---

## Stack

- **Next.js 15** — App Router, TypeScript, `src/` directory layout
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** (Nova preset — Lucide icons + Geist font) — component library
- **Lucide React** — icons
- Plain `fetch` for API calls — no extra HTTP client library

---

## Project structure

```
src/
  app/
    layout.tsx          ← root layout: navbar, dir="rtl", Geist font
    page.tsx            ← home page: intro to the app and its purpose
    search/
      page.tsx          ← search input → product list → price comparison table
    docs/
      page.tsx          ← API docs: all available routes and how to use them
  lib/
    api.ts              ← all fetch calls to the backend API
  components/
    navbar.tsx
```

---

## Environment

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

All API calls go through `src/lib/api.ts` using `process.env.NEXT_PUBLIC_API_URL` as the base URL.

---

## Backend API

The backend is a NestJS REST API. All responses are wrapped:

```json
{ "success": true, "data": { ... }, "timestamp": "..." }
```

On error:
```json
{ "success": false, "statusCode": 404, "message": "...", "timestamp": "..." }
```

### Key routes used by the frontend

| Route | Purpose |
|-------|---------|
| `GET /products?q=&page=&limit=` | Search products by name |
| `GET /products/:barcode/prices` | Get a product + its price in every store, sorted cheapest first |
| `GET /products/groups?q=` | Search product groups (same product, different barcodes across chains) |
| `GET /products/groups/:id/prices/:storeId` | Cheapest price for a group at a specific store |
| `GET /stores?city=&chain=` | List/filter stores |
| `GET /stores/chains` | List all chains with store counts |

### Rate limiting

| Tier | Header | Limit |
|------|--------|-------|
| Free (anonymous) | none | 20 req / 60 s |
| Paid | `x-api-key: <key>` | 500 req / 60 s |

The frontend currently uses the free tier. When user accounts are added, pass the user's API key via `x-api-key`.

---

## Pages

### Home (`/`)
- Introduces the app and its purpose
- Brief explanation of what PriceIL does (compare supermarket prices in Israel)
- Links to the Search and Docs pages

### Search (`/search`)
Search flow has two steps:
1. User types a product name → `GET /products?q=<input>` → show a list of matching products
2. User clicks a product → `GET /products/:barcode/prices` → show a table of all stores with that product, sorted cheapest first

The table columns are: store name, chain, city, price, last updated.

### Docs (`/docs`)
Documents all available API routes and how to use them. Render as a clean, readable page — not a raw markdown dump.

---

## RTL support

The app is primarily in Hebrew. The root `<html>` element must have `dir="rtl"` and `lang="he"`. Use Tailwind's `rtl:` variants for directional styles where needed.

---

## Coding conventions

- All new pages go under `src/app/` following Next.js App Router conventions
- All API calls are centralized in `src/lib/api.ts` — no inline `fetch` in components
- Use shadcn/ui components first before writing custom ones
- Keep pages simple — no unnecessary abstractions for a 3-page app
- Do not add TanStack Query, axios, or other HTTP libraries — plain `fetch` is sufficient
- Do not add auth libraries yet — that comes in a future phase
- TypeScript strict mode is on — no `any` types

---

## Future features (do not implement yet)

- User accounts (Clerk or NextAuth)
- Paid API key purchase (Stripe)
- Shopping basket / price comparison across a full shopping list using `/products/groups/:id/prices/:storeId`
