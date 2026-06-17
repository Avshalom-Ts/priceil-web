# API Routes

All responses are wrapped in a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-18T12:00:00.000Z"
}
```

On error:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product 123 not found",
  "timestamp": "2026-03-18T12:00:00.000Z"
}
```

---

## General

### `GET /`

Returns all available routes for the API.

**Response:**

```json
{
  "status": "ok",
  "routes": [
    { "route": "GET /",                                    "desc": "Return available routes for the app" },
    { "route": "GET /health",                              "desc": "Return app health and db connection" },
    { "route": "GET /me",                                  "desc": "Return current API key plan, usage and remaining quota" },
    { "route": "GET /products?q=&page=&limit=",            "desc": "Return paginated list of products with optional name search" },
    { "route": "GET /products/search?q=&storeId=&page=&limit=", "desc": "Search products by name in a specific store and return their price" },
    { "route": "GET /products/:storeId/like?q=&page=&limit=", "desc": "Ranked 3-pass search for products in a store" },
    { "route": "GET /products/:barcode",                   "desc": "Return a single product by barcode" },
    { "route": "GET /products/:barcode/prices",            "desc": "Return a product with its current prices across all stores" },
    { "route": "GET /products/:barcode/prices/:storeId",   "desc": "Return the price of a product in a specific store" },
    { "route": "GET /products/groups?q=&page=&limit=",     "desc": "Search product groups by name" },
    { "route": "GET /products/groups/:id",                 "desc": "Return a product group with all its member barcodes" },
    { "route": "GET /products/groups/:id/prices/:storeId", "desc": "Return the cheapest price for a product group at a specific store" },
    { "route": "GET /stores/chains",                       "desc": "Return all supermarket chains with their store counts" },
    { "route": "GET /stores?city=&chain=&page=&limit=",    "desc": "Return paginated list of stores with optional filters" },
    { "route": "GET /stores/:id",                          "desc": "Return a single store by ID including chain information" },
    { "route": "POST /basket/compare",                     "desc": "Compare total basket price across all stores" },
    { "route": "POST /basket/total",                       "desc": "Get total basket cost at a single store with per-item breakdown" },
    { "route": "POST /importer/run",                       "desc": "Trigger the data import pipeline" }
  ],
  "timestamp": "2026-03-18T12:00:00.000Z"
}
```

---

### `GET /health`

Returns the current health status of the application and database connection.

**Response:**

```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-03-18T12:00:00.000Z"
}
```

---

### `GET /me`

Returns the current API key's identity, plan, and monthly usage quota.
Requires the `x-api-key` header; returns `401` if missing.

**Response:**

```json
{
  "userId": "user_abc123",
  "app": "my-shopping-app",
  "plan": {
    "monthlyLimit": 10000,
    "used": 342,
    "remaining": 9658
  },
  "period": "2026-06"
}
```

---

## Products

### `GET /products`

Search and browse all products.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Free-text search on product name (case-insensitive, partial match) |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page |

**Example:**
```
GET /products?q=חלב&page=1&limit=10
```

**Response:**

```json
{
  "bestMatch": { "itemCode": "7290000...", "itemName": "חלב תנובה 1L", "..." : "..." },
  "allOthers": [ { "itemCode": "7290000...", "itemName": "חלב תנובה 3% 500ml", "...": "..." } ],
  "total": 342,
  "page": 1,
  "limit": 10
}
```

---

### `GET /products/search`

Search products by name within a specific store and return their price at that store.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Free-text search on product name (case-insensitive, all words must match) |
| `storeId` | number | — | **(Required)** The store's internal `id` |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page |

**Example:**
```
GET /products/search?q=חלב&storeId=12&page=1&limit=10
```

**Response:**

```json
{
  "items": [
    {
      "itemCode": "7290000051352",
      "itemName": "חלב תנובה 3% 1L",
      "price": "5.90",
      "priceUpdateDate": "2026-03-20T00:00:00.000Z",
      "storeId": 12,
      "storeName": "רמי לוי",
      "city": "תל אביב",
      "address": "רחוב הרצל 1",
      "chain": "רמי לוי שיווק השקמה"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

Returns `400` if `storeId` is missing or not a valid number. Returns `404` if the store does not exist.

---

### `GET /products/:storeId/like`

Search products in a specific store using a **3-pass ranked search**. Results are ordered by relevance: exact phrase matches first, then all-words matches, then any-word matches.

**Path param:** `storeId` — the store's internal `id` (integer)

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Free-text search term |
| `page` | number | `1` | Page number (applied to `allOthers`) |
| `limit` | number | `20` | Results per page (applied to `allOthers`) |

**Search passes (in order):**
1. **Pass 1** — full phrase match: product name contains the entire query as a contiguous substring.
2. **Pass 2** — all words match (AND): every word in the query appears somewhere in the name.
3. **Pass 3** — any word matches (OR): at least one word in the query appears in the name.

All three passes run independently. Results are merged `[...pass1, ...pass2, ...pass3]` and deduplicated by `itemCode` in memory (first-pass occurrence wins).

**Example:**
```
GET /products/375/like?q=חלב תנובה 3%&page=1&limit=20
```

**Response:**
```json
{
  "bestMatch": { "itemCode": "7290000051352", "itemName": "חלב תנובה 3% 1L", "price": "5.90", ... },
  "allOthers": [ { "itemCode": "7290000042015", "itemName": "חלב תנובה 3% 500ml", ... } ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

`bestMatch` is the first Pass-1 result; if Pass 1 is empty, the first Pass-2 result; otherwise `null`. `allOthers` contains all remaining results, paginated. `total` is the full deduplicated count including `bestMatch`.

Each item includes all product fields plus `groupId`, `price`, `priceUpdateDate`, and store details (same fields as `GET /products/search` plus the extended product fields).

Returns `400` if `storeId` is not a valid number. Returns `404` if the store does not exist.

---

### `GET /products/:barcode`

Fetch a single product by its barcode.

**Path param:** `barcode` — the product's `item_code`

**Example:**

```text
GET /products/7290000123456
```

**Response:** the product object, or `404` if not found.

---

### `GET /products/:barcode/prices`

Fetch a product together with its current price in every store that carries it.
Results are sorted cheapest store first.

**Path param:** `barcode` — the product's `item_code`

**Example:**

```text
GET /products/7290000123456/prices
```

**Response:**

```json
{
  "product": { "itemCode": "7290000123456", "itemName": "חלב תנובה 1L", ... },
  "prices": [
    { "price": "5.90", "storeName": "רמי לוי", "chain": "רמי לוי שיווק השקמה", "city": "תל אביב", ... },
    { "price": "6.40", "storeName": "שופרסל דיל", "chain": "שופרסל", "city": "רמת גן", ... }
  ]
}
```

---

### `GET /products/:barcode/prices/:storeId`

Fetch the price of a single product in a specific store.

**Path params:**
- `barcode` — the product's `item_code`
- `storeId` — the store's internal `id` (integer)

**Example:**

```text
GET /products/7290000123456/prices/12
```

**Response:**

```json
{
  "price": "5.90",
  "priceUpdateDate": "2026-03-20T00:00:00.000Z",
  "storeId": 12,
  "storeName": "רמי לוי",
  "city": "תל אביב",
  "address": "רחוב הרצל 1",
  "chain": "רמי לוי שיווק השקמה"
}
```

Returns `404` if the barcode does not exist, the store ID does not exist, or the store does not carry the product.

---

## Product Groups

Product groups normalize different barcodes from different chains that represent the same product (same name). Use these routes when building a shopping list — store a `groupId` instead of a specific barcode, and the API will find whichever barcode the store actually carries.

### `GET /products/groups`

Search product groups by name.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Free-text search on group name (all words must match) |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page |

**Example:**
```text
GET /products/groups?q=חלב תנובה
```

**Response:**
```json
{
  "bestMatch": { "id": 42, "name": "חלב תנובה 3% 1L" },
  "allOthers": [ { "id": 43, "name": "חלב תנובה 3% 500ml" } ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### `GET /products/groups/:id`

Fetch a single product group with all its member barcodes.

**Example:**
```text
GET /products/groups/42
```

**Response:**
```json
{
  "id": 42,
  "name": "חלב תנובה 3% 1L",
  "products": [
    { "itemCode": "7290000051352", "itemName": "חלב תנובה 3% 1L" },
    { "itemCode": "7290000042015", "itemName": "חלב תנובה 3% 1L" }
  ]
}
```

Returns `404` if the group ID does not exist.

---

### `GET /products/groups/:id/prices/:storeId`

Fetch the cheapest available price for any barcode in the group at a specific store.
This is the primary route for shopping list price lookups — the store may sell the product under a different barcode than other chains, and this route handles that transparently.

**Path params:**
- `id` — the product group's `id` (integer)
- `storeId` — the store's internal `id` (integer)

**Example:**
```text
GET /products/groups/42/prices/12
```

**Response:**
```json
{
  "groupId": 42,
  "groupName": "חלב תנובה 3% 1L",
  "itemCode": "7290000042015",
  "itemName": "חלב תנובה 3% 1L",
  "price": "5.90",
  "priceUpdateDate": "2026-03-20T00:00:00.000Z",
  "storeId": 12,
  "storeName": "רמי לוי",
  "city": "תל אביב",
  "address": "רחוב הרצל 1",
  "chain": "רמי לוי שיווק השקמה"
}
```

Returns `404` if the group does not exist, the store does not exist, or the store carries none of the group's barcodes.

---

## Stores

### `GET /stores`

List all stores with optional filtering.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `city` | string | — | Filter by city name (partial match) |
| `chain` | string | — | Filter by chain name (partial match) |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page |

**Example:**

```text
GET /stores?city=תל אביב&chain=שופרסל&page=1&limit=20
```

**Response:**

```json
{
  "items": [ { "id": 12, "storeName": "שופרסל דיל", "city": "תל אביב", "chain": { ... }, ... } ],
  "total": 7,
  "page": 1,
  "limit": 20
}
```

---

### `GET /stores/chains`

List all supermarket chains with the number of stores per chain.

**Example:**

```text
GET /stores/chains
```

**Response:**

```json
[
  { "chainId": "7290027600007", "chainName": "שופרסל", "storeCount": 280 },
  { "chainId": "7290058140886", "chainName": "רמי לוי שיווק השקמה", "storeCount": 60 }
]
```

---

### `GET /stores/:id`

Fetch a single store by its internal ID, including chain details.

**Path param:** `id` — the store's internal `id` (integer)

**Example:**

```text
GET /stores/42
```

**Response:** the store object with nested chain, or `404` if not found.

---

## Basket

### `POST /basket/compare`

Compare the total cost of a shopping basket across all stores.
Each store's result shows how much the basket costs there, how many items were found, and which barcodes are missing.
Stores are ranked by total cost ascending (cheapest first).

**Request body:**

```json
{
  "barcodes": ["7290000123456", "7290009876543"],
  "groupIds": [42, 55]
}
```

`barcodes` and `groupIds` can be used together or separately. For groups, the cheapest available barcode in the group is used per store.

**Response:**

```json
[
  {
    "storeId": 12,
    "storeName": "רמי לוי",
    "chain": "רמי לוי שיווק השקמה",
    "city": "תל אביב",
    "address": "רחוב הרצל 1",
    "total": 84.20,
    "found": 2,
    "missing": []
  },
  {
    "storeId": 34,
    "storeName": "שופרסל דיל",
    "chain": "שופרסל",
    "city": "רמת גן",
    "address": "ביאליק 5",
    "total": 90.10,
    "found": 1,
    "missing": ["7290009876543", "group:55"]
  }
]
```

Missing items are either a barcode string or `"group:<id>"` for unresolved group items.
Returns `404` if any barcode or group ID in the request does not exist.

---

### `POST /basket/total`

Get the total cost of a shopping basket at a **single specific store**, including a per-item price breakdown.

**Request body:**

```json
{
  "storeId": 12,
  "groupIds": [42, 17, 88]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `storeId` | number | Yes | The store's internal `id` |
| `groupIds` | number[] | No | Group IDs from `GET /products/groups` |
| `barcodes` | string[] | No | Explicit barcodes (can be combined with `groupIds`) |

**Response:**

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
    { "name": "חלב תנובה 3% 1ל", "itemCode": "7290000051352", "price": 6.90,   "fallback": null },
    { "name": "לחם אחיד פרוס",   "itemCode": "7290000012345", "price": 8.50,   "fallback": "name" },
    { "name": "ביצים L תנובה",   "itemCode": "7290000099001", "price": 17.40,  "fallback": "chain" }
  ]
}
```

Each item in `items` includes a `fallback` field:

| Value | Meaning |
|---|---|
| `null` | Found directly by barcode at this store |
| `"name"` | Not found by barcode — matched by product name at this store (different barcode variant) |
| `"chain"` | Not found at this store at all — price estimated from another branch of the same chain |

Returns `404` if the store ID does not exist, or if any barcode/group ID is unknown.

---

## Importer

### `POST /importer/run`

Manually trigger a data import run.
Scans the data directory for `store_file_*.csv` and `price_file_*.csv` files and loads them into the database.

**Request body (optional):**

```json
{
  "dataDir": "/path/to/csv/files"
}
```

If `dataDir` is omitted, the value of the `IMPORT_DATA_DIR` environment variable is used (defaults to `./data-ex`).

**Response:**

```json
{
  "message": "Import completed"
}
```

---

## Rate Limiting

All endpoints are rate-limited.

| Tier | Limit |
|---|---|
| Free (no API key) | 20 requests / 60 seconds |
| Paid (`x-api-key` header) | 500 requests / 60 seconds |

To use the paid tier, add the header:

```text
x-api-key: <your-key>
```

Paid keys are configured via the `PAID_API_KEYS` environment variable (comma-separated).
