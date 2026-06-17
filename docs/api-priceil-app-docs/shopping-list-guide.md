# Shopping List Guide

How to build a shopping list and compare its total price across all stores.

---

## Overview

The recommended flow is:

1. **Search** for each product by name → `GET /products/groups?q=...`
2. **Collect** the `id` of each result (the group ID)
3. **Get the total** for a specific store → `POST /basket/total`

Use `groupIds` (not raw barcodes) — a group represents the same product regardless of which barcode a specific chain uses.

---

## Step 1 — Search for each product

```
GET /products/groups?q=חלב תנובה 3%
```

Response:
```json
{
  "data": {
    "items": [
      { "id": 42, "name": "חלב תנובה 3% 1ל", "normalizedName": "1ל 3% חלב תנובה" }
    ],
    "total": 1
  }
}
```

Repeat for each item on the list. Collect the `id` from each result.

> **Tip:** If the search returns more than one result, present the list to the user so they can pick the exact product they want.

---

## Step 2 — Build the group ID list

After searching for all products, you have a list of group IDs:

```
חלב תנובה 3% 1ל   → groupId 42
לחם אחיד פרוס     → groupId 17
ביצים L תנובה 12  → groupId 88
```

---

## Step 3 — Get the total for a specific store

Once you know which store you want (from `GET /stores` or from the user), send all group IDs together with the store ID:

```
POST /basket/total
Content-Type: application/json

{
  "storeId": 12,
  "groupIds": [42, 17, 88]
}
```

Response:
```json
{
  "storeId": 12,
  "storeName": "רמי לוי",
  "chain": "רמי לוי שיווק השקמה",
  "city": "תל אביב",
  "address": "רחוב הרצל 1",
  "total": 32.80,
  "found": 3,
  "missing": [],
  "items": [
    { "name": "חלב תנובה 3% 1ל", "itemCode": "7290000051352", "price": 6.90,  "fallback": null },
    { "name": "לחם אחיד פרוס",   "itemCode": "7290000012345", "price": 8.50,  "fallback": "name" },
    { "name": "ביצים L תנובה",   "itemCode": "7290000099001", "price": 17.40, "fallback": "chain" }
  ]
}
```

- `total` — the full basket price at this store (NIS)
- `items` — price breakdown per product
- `missing` — products that couldn't be found anywhere in the chain
- `fallback` — how each item's price was resolved:
  - `null` — the exact barcode was found at this store
  - `"name"` — the barcode wasn't at this store, but a product with the same name was found here
  - `"chain"` — not found at this store at all; price is from another branch of the same chain

---

## Don't know which store yet? Compare first

Use `POST /basket/compare` with just `groupIds` (no `storeId`) to get all stores ranked cheapest first, then call `POST /basket/total` with the store you pick.

---

## Filtering by store or city

If you want to compare only within a specific city or chain, first get the store IDs:

```
GET /stores?city=תל אביב&chain=שופרסל
```

Then check the price of a group at a specific store:

```
GET /products/groups/42/prices/12
```

This returns the exact barcode, price, and update date for that product at that store.

---

## Complete example

**Goal:** Find the total price for milk, bread, and eggs at a specific store.

```
# 1. Search
GET /products/groups?q=חלב תנובה 3%    → id: 42
GET /products/groups?q=לחם אחיד פרוס   → id: 17
GET /products/groups?q=ביצים L תנובה   → id: 88

# 2. Get total at store 12
POST /basket/total
{ "storeId": 12, "groupIds": [42, 17, 88] }

# Response includes total + per-item breakdown
```

That's it — three searches and one total request.
