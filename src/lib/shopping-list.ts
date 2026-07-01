import type { Product, Store } from "@/lib/api";

export interface BasketItem {
  itemCode: string;
  itemName: string;
  qty: number;
  price?: string;
  priceUpdateDate?: string;
  storeId?: number;
  unitQty?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
}

export interface StoreWithDistance extends Store {
  distanceKm?: number;
}

export function normalizeCity(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/["'`.,\-_/\\]/g, " ")
    .replace(/\s+/g, " ");
}

export function citiesMatch(a: string, b: string): boolean {
  const na = normalizeCity(a);
  const nb = normalizeCity(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function toNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatBasketPrice(price?: string): string {
  return price ? `₪${parseFloat(price).toFixed(2)}` : "מחיר לא זמין";
}

export function toBasketItem(product: Product, qty = 1): BasketItem {
  return {
    itemCode: product.itemCode,
    itemName: product.itemName,
    qty,
    unitQty: (product as { unitQty?: string }).unitQty,
    priceUpdateDate: (product as { priceUpdateDate?: string }).priceUpdateDate,
  };
}
