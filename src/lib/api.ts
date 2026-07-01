const BASE_URL = "/backend-api";

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
