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

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  // unwrap the standard envelope
  return (json.data ?? json) as T;
}

export async function searchProducts(
  q: string,
  page = 1,
  limit = 20,
): Promise<SearchProductsResult> {
  return apiFetch(
    `/products?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
  );
}

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

export async function getProductPrices(
  barcode: string,
): Promise<{ product: Product; prices: ProductPrice[] }> {
  return apiFetch(`/products/${barcode}/prices`);
}

export async function getProductPriceInStore(
  barcode: string,
  storeId: number,
): Promise<ProductPrice> {
  return apiFetch(`/products/${barcode}/prices/${storeId}`);
}

export async function getStores(
  city?: string,
  chain?: string,
): Promise<StoresResult> {
  const params = new URLSearchParams({ limit: "500" });
  if (city) params.set("city", city);
  if (chain) params.set("chain", chain);
  return apiFetch(`/stores?${params.toString()}`);
}

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
