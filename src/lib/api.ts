const BASE_URL = "/backend-api";

export const ADMIN_DATABASE_TABLES = [
  "chains",
  "stores",
  "products",
  "product_groups",
  "prices",
] as const;
export type AdminDatabaseTableName = (typeof ADMIN_DATABASE_TABLES)[number];
export type AdminCell = string | number | boolean | null;
export type AdminRow = Record<string, AdminCell>;
export type AdminPageSize = 25 | 50 | 75 | 100;
export interface AdminColumn {
  key: string;
  dbColumn: string;
  label: string;
  type: "text" | "integer" | "decimal" | "boolean" | "date" | "datetime";
  nullable: boolean;
  editable: boolean;
  readOnlyReason?: string;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  precision?: number;
  scale?: number;
  reference?: { table: string; key: string };
}
export interface AdminTable {
  table: AdminDatabaseTableName;
  label: string;
  primaryKey: string;
  canUpdate: boolean;
  canDelete: boolean;
  searchableFields: string[];
  columns: AdminColumn[];
  note?: string;
}
export interface AdminRowsResult {
  items: AdminRow[];
  total: number;
  page: number;
  limit: AdminPageSize;
  totalPages: number;
}
export interface AdminRowDetail {
  item: AdminRow;
  revision: string;
  references: { field: string; table: string; key: string; value: AdminCell }[];
}

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isCell(value: unknown): value is AdminCell {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}
function isRow(value: unknown): value is AdminRow {
  return isRecord(value) && Object.values(value).every(isCell);
}
function isColumn(value: unknown): value is AdminColumn {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    /^[A-Za-z][A-Za-z0-9]*$/.test(value.key) &&
    typeof value.dbColumn === "string" &&
    typeof value.label === "string" &&
    typeof value.type === "string" &&
    ["text", "integer", "decimal", "boolean", "date", "datetime"].includes(
      value.type,
    ) &&
    typeof value.nullable === "boolean" &&
    typeof value.editable === "boolean" &&
    ["maxLength", "minimum", "maximum", "precision", "scale"].every(
      (key) =>
        value[key] === undefined ||
        (typeof value[key] === "number" && Number.isFinite(value[key])),
    ) &&
    (value.readOnlyReason === undefined ||
      typeof value.readOnlyReason === "string") &&
    (value.reference === undefined ||
      (isRecord(value.reference) &&
        typeof value.reference.table === "string" &&
        typeof value.reference.key === "string"))
  );
}
function isTable(value: unknown): value is AdminTable {
  return (
    isRecord(value) &&
    ADMIN_DATABASE_TABLES.some((table) => table === value.table) &&
    typeof value.label === "string" &&
    typeof value.primaryKey === "string" &&
    typeof value.canUpdate === "boolean" &&
    typeof value.canDelete === "boolean" &&
    Array.isArray(value.columns) &&
    value.columns.length > 0 &&
    value.columns.every(isColumn) &&
    new Set(value.columns.map((column) => column.key)).size ===
      value.columns.length &&
    value.columns.some((column) => column.key === value.primaryKey) &&
    Array.isArray(value.searchableFields) &&
    value.searchableFields.every((field) => typeof field === "string") &&
    (value.note === undefined || typeof value.note === "string")
  );
}

async function adminFetch<T>(
  path: string,
  decode: (value: unknown) => value is T,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/admin/database${path}`, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AdminApiError(
      response.ok ? 502 : response.status,
      "התקבלה תשובה לא תקינה מהשרת",
    );
  }
  if (!response.ok) {
    const message =
      isRecord(body) && typeof body.message === "string"
        ? body.message
        : isRecord(body) && typeof body.error === "string"
          ? body.error
          : "הבקשה נכשלה";
    const fieldErrors =
      isRecord(body) && isRecord(body.fieldErrors)
        ? Object.fromEntries(
            Object.entries(body.fieldErrors).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          )
        : {};
    throw new AdminApiError(response.status, message, fieldErrors);
  }
  if (!isRecord(body) || body.success !== true || !decode(body.data))
    throw new AdminApiError(502, "מבנה הנתונים שהתקבל מהשרת אינו תקין");
  return body.data;
}

export function getAdminTables(signal?: AbortSignal): Promise<AdminTable[]> {
  return adminFetch(
    "/tables",
    (value): value is AdminTable[] =>
      Array.isArray(value) &&
      value.every(isTable) &&
      new Set(value.map((table) => table.table)).size === value.length,
    { signal },
  );
}
export function getAdminRows(
  table: AdminDatabaseTableName,
  query: { q: string; page: number; limit: AdminPageSize },
  signal?: AbortSignal,
): Promise<AdminRowsResult> {
  const params = new URLSearchParams({
    q: query.q,
    page: String(query.page),
    limit: String(query.limit),
  });
  return adminFetch(
    `/${table}?${params}`,
    (value): value is AdminRowsResult =>
      isRecord(value) &&
      Array.isArray(value.items) &&
      value.items.every(isRow) &&
      ["total", "page", "totalPages"].every(
        (key) =>
          typeof value[key] === "number" &&
          Number.isSafeInteger(value[key]) &&
          value[key] >= 0,
      ) &&
      typeof value.limit === "number" &&
      [25, 50, 75, 100].includes(value.limit),
    { signal },
  );
}
function isDetail(value: unknown): value is AdminRowDetail {
  return (
    isRecord(value) &&
    isRow(value.item) &&
    typeof value.revision === "string" &&
    /^[a-f0-9]{64}$/.test(value.revision) &&
    Array.isArray(value.references) &&
    value.references.every(
      (reference) =>
        isRecord(reference) &&
        typeof reference.field === "string" &&
        typeof reference.table === "string" &&
        typeof reference.key === "string" &&
        isCell(reference.value),
    )
  );
}
export function getAdminRow(
  table: AdminDatabaseTableName,
  id: string,
  signal?: AbortSignal,
): Promise<AdminRowDetail> {
  return adminFetch(`/${table}/${encodeURIComponent(id)}`, isDetail, {
    signal,
  });
}
export function updateAdminRow(
  table: AdminDatabaseTableName,
  id: string,
  changes: AdminRow,
  revision: string,
): Promise<AdminRowDetail> {
  return adminFetch(`/${table}/${encodeURIComponent(id)}`, isDetail, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changes, revision }),
  });
}
export function deleteAdminRow(
  table: AdminDatabaseTableName,
  id: string,
  revision: string,
): Promise<{ deleted: true; id: string | number }> {
  return adminFetch(
    `/${table}/${encodeURIComponent(id)}`,
    (value): value is { deleted: true; id: string | number } =>
      isRecord(value) &&
      value.deleted === true &&
      (typeof value.id === "string" || typeof value.id === "number"),
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revision }),
    },
  );
}

export interface Product {
  itemCode: string;
  itemName: string;
}

export interface ProductPrice {
  price: string;
  priceUpdateDate: string;
  storeId: number;
  storeName: string;
  city: string;
  address: string;
  chain: string;
}

export interface Store {
  id: number;
  storeName: string;
  city: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  chain: {
    chainId: string;
    chainName: string;
  };
}

export interface StoreChain {
  chainId: string;
  chainName: string;
  storeCount: number;
}

export interface SearchProductsResult {
  bestMatch: Product | null;
  allOthers: Product[];
  total: number;
  page: number;
  limit: number;
}

export type SearchInStoreProduct = Product & {
  price: string;
  priceUpdateDate: string;
  storeId: number;
  storeName: string;
  city: string;
  address: string;
  chain: string;
  groupId: number | null;
  unitQty: string;
  quantity: string;
  isWeighted: boolean;
};

export interface SearchInStoreResult {
  bestMatch: SearchInStoreProduct | null;
  allOthers: SearchInStoreProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface StoresResult {
  items: Store[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetches data from the backend API and unwraps the standard envelope.
 * @param path - The API endpoint path (e.g., "/products").
 * @returns A promise that resolves to the unwrapped data of type T.
 * @throws If the API request fails or returns an error status.
 * @example
 * apiFetch("/products").then(data => console.log(data));
 */
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  // unwrap the standard envelope
  return (json.data ?? json) as T;
}

/**
 * Searches for products by name or barcode.
 * @param q - The search query (product name or barcode).
 * @param page - The page number for pagination (default is 1).
 * @param limit - The number of results per page (default is 20).
 * @returns A promise that resolves to a SearchProductsResult object containing the search results.
 * @throws If the API request fails or returns an error status.
 * @example
 * searchProducts("Milk").then(results => console.log(results));
 */
export async function searchProducts(
  q: string,
  page = 1,
  limit = 20,
): Promise<SearchProductsResult> {
  return apiFetch(
    `/products?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
  );
}

/**
 * Searches for products in a specific store by name or barcode.
 * @param q - The search query (product name or barcode).
 * @param storeId - The ID of the store to search in.
 * @param page - The page number for pagination (default is 1).
 * @param limit - The number of results per page (default is 20).
 * @returns A promise that resolves to a SearchInStoreResult object containing the search results.
 * @throws If the API request fails or returns an error status.
 * @example
 * searchProductsInStore("Milk", 1).then(results => console.log(results));
 */
export async function searchProductsInStore(
  q: string,
  storeId: number,
  page = 1,
  limit = 20,
): Promise<SearchInStoreResult> {
  return apiFetch(
    `/products/${storeId}/like?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
  );
}

/**
 * Returns the prices of a product across all stores.
 * @param barcode - The barcode of the product.
 * @returns A promise that resolves to an object containing the product and its prices in various stores.
 * @throws If the API request fails or returns an error status.
 * @example
 * getProductPrices("1234567890123").then(({ product, prices }) => console.log(product, prices));
 */
export async function getProductPrices(
  barcode: string,
): Promise<{ product: Product; prices: ProductPrice[] }> {
  return apiFetch(`/products/${barcode}/prices`);
}

/**
 * Returns the price of a product in a specific store.
 * @param barcode - The barcode of the product.
 * @param storeId - The ID of the store.
 * @returns A promise that resolves to a ProductPrice object.
 * @throws If the API request fails or returns an error status.
 * @example
 * getProductPriceInStore("1234567890123", 1).then(price => console.log(price));
 */
export async function getProductPriceInStore(
  barcode: string,
  storeId: number,
): Promise<ProductPrice> {
  return apiFetch(`/products/${barcode}/prices/${storeId}`);
}

/**
 * Returns a list of stores, optionally filtered by city and/or chain.
 * @param city - Optional city name to filter stores.
 * @param chain - Optional chain name to filter stores.
 * @returns A promise that resolves to a StoresResult object containing the list of stores.
 * @throws If the API request fails or returns an error status.
 * @example
 * getStores("Tel Aviv", "SuperMart").then(stores => console.log(stores));
 */
export async function getStores(
  city?: string,
  chain?: string,
): Promise<StoresResult> {
  const params = new URLSearchParams({ limit: "500" });
  if (city) params.set("city", city);
  if (chain) params.set("chain", chain);
  return apiFetch(`/stores?${params.toString()}`);
}

/**
 * Returns a list of store chains available in the system.
 * @returns An array of StoreChain objects.
 * @throws If the API request fails or returns an error status.
 * @example
 * getChains().then(chains => console.log(chains));
 */
export async function getChains(): Promise<StoreChain[]> {
  return apiFetch("/stores/chains");
}

/**
 * Given latitude and longitude, returns the nearest city name using a reverse geocoding API.
 * @param lat - The latitude of the location.
 * @param lon - The longitude of the location.
 * @returns The name of the nearest city.
 * @throws If the geocoding API request fails or returns an error status.
 * @example
 * https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=31.960035&longitude=34.883198&localityLanguage=he
 */
export async function getCurrentCity(
  lat: number,
  lon: number,
): Promise<string> {
  const cityResult: Response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=he`,
  );
  if (!cityResult.ok)
    throw new Error(`Geocoding API error ${cityResult.status}`);
  const cityJson = await cityResult.json();
  return (
    cityJson.city ||
    cityJson.locality ||
    cityJson.principalSubdivision ||
    "Unknown location"
  );
}
