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
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchInStoreResult {
  items: (Product & {
    price: string;
    priceUpdateDate: string;
    storeId: number;
    storeName: string;
    city: string;
    address: string;
    chain: string;
  })[];
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
    `/products/search?q=${encodeURIComponent(q)}&storeId=${storeId}&page=${page}&limit=${limit}`,
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
