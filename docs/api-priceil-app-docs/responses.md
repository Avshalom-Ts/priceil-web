# API Response Objects

All successful responses are wrapped by the global `ResponseInterceptor`:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-21T12:00:00.000Z"
}
```

All errors are shaped by the global `AllExceptionsFilter`:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product 7290000123456 not found",
  "timestamp": "2026-03-21T12:00:00.000Z"
}
```

The `data` field for each route is described below.

---

## `GET /`

```json
{
  "status": "ok",
  "routes": [
    { "route": "GET /", "desc": "Return available routes for the app" },
    { "route": "GET /health", "desc": "Return app health and db connection" }
  ],
  "timestamp": "2026-03-21T12:00:00.000Z"
}
```

---

## `GET /health`

```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-03-21T12:00:00.000Z"
}
```

`db` is either `"connected"` or `"disconnected"`.

---

## `GET /me`

Requires the `x-api-key` header. Returns `401` if missing or invalid.

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

`monthlyLimit` and `remaining` are `"unlimited"` (string) when the plan has no cap.

| Field | Type | Description |
|---|---|---|
| `userId` | `string` | Unique user identifier |
| `app` | `string\|null` | App name associated with the key, or `null` |
| `plan.monthlyLimit` | `number\|"unlimited"` | Max requests allowed per calendar month |
| `plan.used` | `number` | Requests made in the current month |
| `plan.remaining` | `number\|"unlimited"` | Remaining requests for the current month |
| `period` | `string` | Current billing period in `YYYY-MM` format |

---

## `GET /products`

Returns a 3-pass ranked search result (same structure as `GET /products/:storeId/like` but without price or store fields). When no query is provided, `bestMatch` is `null` and `allOthers` contains all products paginated.

```json
{
  "bestMatch": {
    "itemCode": "7290000123456",
    "itemName": "חלב תנובה 1L",
    "itemType": 1,
    "manufacturerName": "תנובה",
    "manufactureCountry": "IL",
    "manufacturerDescription": "תנובה מרכז שיתופי",
    "unitQty": "ליטר",
    "quantity": "1.000",
    "isWeighted": false,
    "unitOfMeasure": "100 מ\"ל",
    "qtyInPackage": 1
  },
  "allOthers": [
    {
      "itemCode": "7290000054321",
      "itemName": "חלב תנובה 3% 500ml",
      "itemType": 1,
      "...": "..."
    }
  ],
  "total": 342,
  "page": 1,
  "limit": 20
}
```

| Field | Type | Description |
|---|---|---|
| `bestMatch` | `object\|null` | First Pass-1 result; if empty, first Pass-2 result; otherwise `null` |
| `allOthers` | `Product[]` | All remaining deduplicated results, paginated |
| `total` | `number` | Total number of matching products (including `bestMatch`) |
| `page` | `number` | Current page number (applies to `allOthers`) |
| `limit` | `number` | Page size (applies to `allOthers`) |

---

## `GET /products/:storeId/like`

Returns a 3-pass ranked search result. Results are deduplicated by `itemCode` and merged as `[...pass1, ...pass2, ...pass3]`.

```json
{
  "bestMatch": {
    "itemCode": "7290000051352",
    "itemName": "חלב תנובה 3% 1L",
    "itemType": 1,
    "manufacturerName": "תנובה",
    "manufactureCountry": "IL",
    "manufacturerDescription": "תנובה מרכז שיתופי",
    "unitQty": "ליטר",
    "quantity": "1.000",
    "isWeighted": false,
    "unitOfMeasure": "100 מ\"ל",
    "qtyInPackage": 1,
    "groupId": 42,
    "price": "5.90",
    "priceUpdateDate": "2026-03-20T00:00:00.000Z",
    "storeId": 12,
    "storeName": "רמי לוי",
    "city": "תל אביב",
    "address": "רחוב הרצל 1",
    "chain": "רמי לוי שיווק השקמה"
  },
  "allOthers": [
    {
      "itemCode": "7290000042015",
      "itemName": "חלב תנובה 3% 500ml",
      ...
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

| Field | Type | Description |
|---|---|---|
| `bestMatch` | `object\|null` | The single highest-ranked result. First Pass-1 result; if empty, first Pass-2 result; otherwise `null` |
| `allOthers` | `array` | All remaining deduplicated results, paginated. Preserves pass order: Pass-1 remainders → Pass-2 → Pass-3 |
| `total` | `number` | Full deduplicated result count (including `bestMatch`) |
| `page` | `number` | Current page (applies to `allOthers`) |
| `limit` | `number` | Page size (applies to `allOthers`) |

Each item in `bestMatch` and `allOthers`:

| Field | Type | Description |
|---|---|---|
| `itemCode` | `string` | Product barcode |
| `itemName` | `string` | Product name |
| `itemType` | `number` | Product type code |
| `manufacturerName` | `string` | Manufacturer name |
| `manufactureCountry` | `string` | Country of manufacture |
| `manufacturerDescription` | `string` | Manufacturer description |
| `unitQty` | `string` | Unit quantity label |
| `quantity` | `string` (decimal) | Package quantity |
| `isWeighted` | `boolean` | Whether the product is sold by weight |
| `unitOfMeasure` | `string` | Unit of measure |
| `qtyInPackage` | `number` | Units per package |
| `groupId` | `number\|null` | The product group ID, or `null` if not grouped |
| `price` | `string` (decimal) | Current shelf price in NIS |
| `priceUpdateDate` | `timestamptz` | When the price was last updated |
| `storeId` | `number` | Internal store ID |
| `storeName` | `string` | Store branch name |
| `city` | `string` | City of the store |
| `address` | `string` | Street address of the store |
| `chain` | `string` | Chain name |

Returns `400` if `storeId` is not a valid number. Returns `404` if the store does not exist.

---

## `GET /products/search`

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
  "limit": 20
}
```

| Field | Type | Description |
|---|---|---|
| `items` | `SearchResult[]` | Array of matching products with their price at the requested store |
| `total` | `number` | Total number of matching products in this store |
| `page` | `number` | Current page number |
| `limit` | `number` | Page size |

Each item in `items`:

| Field | Type | Description |
|---|---|---|
| `itemCode` | `string` | Product barcode |
| `itemName` | `string` | Product name |
| `price` | `string` (decimal) | Current shelf price in NIS |
| `priceUpdateDate` | `timestamptz` | When the price was last updated |
| `storeId` | `number` | Internal store ID |
| `storeName` | `string` | Store branch name |
| `city` | `string` | City of the store |
| `address` | `string` | Street address of the store |
| `chain` | `string` | Chain name |

Returns `400` if `storeId` is missing or not a valid number. Returns `404` if the store does not exist.

---

## `GET /products/:barcode`

Returns a single product object.

```json
{
  "itemCode": "7290000123456",
  "itemName": "חלב תנובה 1L",
  "itemType": 1,
  "manufacturerName": "תנובה",
  "manufactureCountry": "IL",
  "manufacturerDescription": "תנובה מרכז שיתופי",
  "unitQty": "ליטר",
  "quantity": "1.000",
  "isWeighted": false,
  "unitOfMeasure": "100 מ\"ל",
  "qtyInPackage": 1
}
```

Returns `404` if the barcode does not exist.

---

## `GET /products/:barcode/prices/:storeId`

Returns the price of a single product in a specific store.

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

## `GET /products/groups`

Returns a 3-pass ranked search result. When no query is provided, `bestMatch` is `null` and `allOthers` contains all groups paginated. Each group includes its member `products`.

```json
{
  "bestMatch": {
    "id": 42,
    "name": "חלב תנובה 3% 1L",
    "normalizedName": "1l 3% חלב תנובה",
    "products": [
      {
        "itemCode": "7290000051352",
        "itemName": "חלב תנובה 3% 1L",
        "itemType": 1,
        "manufacturerName": "תנובה",
        "manufactureCountry": "IL",
        "manufacturerDescription": "תנובה מרכז שיתופי",
        "unitQty": "ליטר",
        "quantity": "1.000",
        "isWeighted": false,
        "unitOfMeasure": "100 מ\"ל",
        "qtyInPackage": 1
      }
    ]
  },
  "allOthers": [
    { "id": 43, "name": "חלב תנובה 3% 500ml", "normalizedName": "...", "products": [] }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

| Field | Type | Description |
|---|---|---|
| `bestMatch` | `object\|null` | First Pass-1 result; if empty, first Pass-2 result; otherwise `null` |
| `allOthers` | `ProductGroup[]` | All remaining deduplicated results, paginated |
| `total` | `number` | Total group count (including `bestMatch`) |
| `page` | `number` | Current page number (applies to `allOthers`) |
| `limit` | `number` | Page size (applies to `allOthers`) |

---

## `GET /products/groups/:id`

```json
{
  "id": 42,
  "name": "חלב תנובה 3% 1L",
  "normalizedName": "1l 3% חלב תנובה",
  "products": [
    { "itemCode": "7290000051352", "itemName": "חלב תנובה 3% 1L" },
    { "itemCode": "7290000042015", "itemName": "חלב 3% תנובה 1ל" }
  ]
}
```

Returns `404` if the group ID does not exist.

---

## `GET /products/groups/:id/prices/:storeId`

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

| Field | Type | Description |
|---|---|---|
| `groupId` | `number` | The product group ID |
| `groupName` | `string` | Normalized product name |
| `itemCode` | `string` | The specific barcode this store carries |
| `itemName` | `string` | Product name as listed by this chain |
| `price` | `string` (decimal) | Cheapest available price in NIS |
| `priceUpdateDate` | `timestamptz` | When the price was last updated |
| `storeId` | `number` | Internal store ID |
| `storeName` | `string` | Store branch name |
| `city` | `string` | City of the store |
| `address` | `string` | Street address of the store |
| `chain` | `string` | Chain name |

Returns `404` if the group does not exist, the store does not exist, or the store carries none of the group's barcodes.

---

## `GET /products/:barcode/prices`

```json
{
  "product": {
    "itemCode": "7290000123456",
    "itemName": "חלב תנובה 1L",
    "itemType": 1,
    "manufacturerName": "תנובה",
    "manufactureCountry": "IL",
    "manufacturerDescription": "תנובה מרכז שיתופי",
    "unitQty": "ליטר",
    "quantity": "1.000",
    "isWeighted": false,
    "unitOfMeasure": "100 מ\"ל",
    "qtyInPackage": 1
  },
  "prices": [
    {
      "price": "5.90",
      "priceUpdateDate": "2026-03-20T00:00:00.000Z",
      "storeId": 12,
      "storeName": "רמי לוי",
      "city": "תל אביב",
      "address": "רחוב הרצל 1",
      "chain": "רמי לוי שיווק השקמה"
    },
    {
      "price": "6.40",
      "priceUpdateDate": "2026-03-20T00:00:00.000Z",
      "storeId": 34,
      "storeName": "שופרסל דיל",
      "city": "רמת גן",
      "address": "ביאליק 5",
      "chain": "שופרסל"
    }
  ]
}
```

`prices` is sorted by `price` ascending (cheapest store first).
Returns `404` if the barcode does not exist.

### Price entry fields

| Field | Type | Description |
|---|---|---|
| `price` | `string` (decimal) | Current shelf price in NIS |
| `priceUpdateDate` | `timestamptz` | When the price was last changed at the source |
| `storeId` | `number` | Internal store ID |
| `storeName` | `string` | Store branch name |
| `city` | `string` | City of the store |
| `address` | `string` | Street address of the store |
| `chain` | `string` | Chain name |

---

## `GET /stores`

```json
{
  "items": [
    {
      "id": 12,
      "chainId": "7290058140886",
      "subchainId": "1",
      "storeId": "5",
      "subchainName": "רמי לוי",
      "storeName": "רמי לוי תל אביב",
      "storeType": 1,
      "address": "רחוב הרצל 1",
      "city": "תל אביב",
      "zipcode": "6100000",
      "bikoretNo": 100,
      "lastUpdateDate": "2026-03-20",
      "latitude": "32.0853000",
      "longitude": "34.7817600",
      "chain": {
        "chainId": "7290058140886",
        "chainName": "רמי לוי שיווק השקמה"
      }
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 20
}
```

| Field | Type | Description |
|---|---|---|
| `items` | `Store[]` | Array of store objects for the current page |
| `total` | `number` | Total number of matching stores |
| `page` | `number` | Current page number |
| `limit` | `number` | Page size |

Each store includes a nested `chain` object.

---

## `GET /stores/chains`

Returns an array of chain objects, each with a computed `storeCount`.

```json
[
  {
    "chainId": "7290027600007",
    "chainName": "שופרסל",
    "storeCount": 280
  },
  {
    "chainId": "7290058140886",
    "chainName": "רמי לוי שיווק השקמה",
    "storeCount": 60
  }
]
```

| Field | Type | Description |
|---|---|---|
| `chainId` | `string` | Official chain identifier |
| `chainName` | `string` | Human-readable chain name |
| `storeCount` | `number` | Number of stores belonging to this chain |

---

## `GET /stores/:id`

Returns a single store object with nested chain.

```json
{
  "id": 12,
  "chainId": "7290058140886",
  "subchainId": "1",
  "storeId": "5",
  "subchainName": "רמי לוי",
  "storeName": "רמי לוי תל אביב",
  "storeType": 1,
  "address": "רחוב הרצל 1",
  "city": "תל אביב",
  "zipcode": "6100000",
  "bikoretNo": 100,
  "lastUpdateDate": "2026-03-20",
  "latitude": "32.0853000",
  "longitude": "34.7817600",
  "chain": {
    "chainId": "7290058140886",
    "chainName": "רמי לוי שיווק השקמה"
  }
}
```

Returns `404` if the store ID does not exist.

---

## `POST /basket/compare`

Returns an array of stores sorted by total basket cost ascending (cheapest first).
Only stores that carry at least one of the requested barcodes are included.

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
    "total": 47.50,
    "found": 1,
    "missing": ["7290009876543"]
  }
]
```

| Field | Type | Description |
|---|---|---|
| `storeId` | `number` | Internal store ID |
| `storeName` | `string` | Store branch name |
| `chain` | `string` | Chain name |
| `city` | `string` | City of the store |
| `address` | `string` | Street address of the store |
| `total` | `number` | Sum of prices for all found items (NIS) |
| `found` | `number` | Number of requested barcodes found in this store |
| `missing` | `string[]` | Barcodes not carried by this store, or `"group:<id>"` for unresolved group items |

Returns `404` if any barcode or group ID in the request does not exist.

---

## `POST /basket/total`

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

| Field | Type | Description |
|---|---|---|
| `storeId` | `number` | Internal store ID |
| `storeName` | `string` | Store branch name |
| `chain` | `string` | Chain name |
| `city` | `string` | City of the store |
| `address` | `string` | Street address |
| `total` | `number` | Sum of prices for all found items (NIS) |
| `found` | `number` | Number of requested items found at this store |
| `missing` | `string[]` | Items not carried by this store (`"group:<id>"` or barcode) |
| `items` | `array` | Per-item breakdown — `name`, `itemCode`, `price` (null if missing), `fallback` |

Each item in `items`:

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Product or group name |
| `itemCode` | `string` | Barcode actually used (empty string if missing) |
| `price` | `number\|null` | Price in NIS, or `null` if not found anywhere |
| `fallback` | `null\|"name"\|"chain"` | How the price was resolved (see below) |

`fallback` values:

| Value | Meaning |
|---|---|
| `null` | Found directly by barcode at this store |
| `"name"` | Matched by product name at this store (different barcode variant) |
| `"chain"` | Price taken from another branch of the same chain |

Returns `404` if the store does not exist or any barcode/group ID is unknown.

---

## `POST /importer/run`

```json
{
  "chains": 12,
  "stores": 540,
  "products": 85000,
  "prices": 4200000
}
```

| Field | Type | Description |
|---|---|---|
| `chains` | `number` | Number of chain records upserted |
| `stores` | `number` | Number of store records upserted |
| `products` | `number` | Number of product records upserted |
| `prices` | `number` | Number of price records upserted |
