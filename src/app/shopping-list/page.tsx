"use client";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = { title: "רשימת קניות" }

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Search,
  X,
  ShoppingCart,
  Loader2,
  Store as StoreIcon,
  LocateFixed,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  searchProducts,
  searchProductsInStore,
  getStores,
  getProductPriceInStore,
  type Product,
  type Store,
  getCurrentCity,
} from "@/lib/api";

const BASKET_KEY = "priceil_basket";

interface BasketItem {
  itemCode: string;
  itemName: string;
  price?: string;
  storeId?: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
}

interface StoreWithDistance extends Store {
  distanceKm?: number;
}

function loadBasket(): BasketItem[] {
  try {
    const raw = localStorage.getItem(BASKET_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBasket(items: BasketItem[]) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(items));
}

function toNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function haversineKm(
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

export default function ShoppingListPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [stores, setStores] = useState<Store[]>([]);
  const [storeFilter, setStoreFilter] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [loadingPrices, setLoadingPrices] = useState<Set<string>>(new Set());

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const basketRef = useRef<BasketItem[]>([]);

  const requestUserLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("המכשיר לא תומך בזיהוי מיקום");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city = await getCurrentCity(pos.coords.latitude, pos.coords.longitude).catch(() => "");
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          city,
        });
        getStores(city || undefined)
          .then((res) => setStores(res.items ?? []))
          .catch(() => { });
        setLocating(false);
      },
      () => {
        setLocationError("לא התקבלה הרשאה למיקום");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 },
    );
  }, []);

  // Load basket from localStorage on mount
  useEffect(() => {
    setBasket(loadBasket());
  }, []);

  // Load stores
  useEffect(() => {
    getStores()
      .then((res) => setStores(res.items ?? []))
      .catch(() => { });
  }, []);

  // Try to get user location on first load (can fail silently)
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  const storesSortedByLocation = useMemo<StoreWithDistance[]>(() => {
    const base = [...stores] as StoreWithDistance[];

    if (!userLocation) {
      return base.sort((a, b) => {
        const aChain = a.chain?.chainName ?? "";
        const bChain = b.chain?.chainName ?? "";
        const c = aChain.localeCompare(bChain, "he");
        if (c !== 0) return c;

        const aCity = a.city ?? "";
        const bCity = b.city ?? "";
        const city = aCity.localeCompare(bCity, "he");
        if (city !== 0) return city;

        const aStore = a.storeName ?? "";
        const bStore = b.storeName ?? "";
        return aStore.localeCompare(bStore, "he");
      });
    }

    const withDistance = base.map((store) => {
      const lat = toNum(store.latitude);
      const lon = toNum(store.longitude);
      if (lat === null || lon === null) return { ...store, distanceKm: undefined };
      return {
        ...store,
        distanceKm: haversineKm(
          userLocation.latitude,
          userLocation.longitude,
          lat,
          lon,
        ),
      };
    });



    withDistance.sort((a, b) => {
      const ad = a.distanceKm;
      const bd = b.distanceKm;
      if (ad === undefined && bd === undefined) return 0;
      if (ad === undefined) return 1;
      if (bd === undefined) return -1;
      return ad - bd;
    });

    return withDistance;
  }, [stores, userLocation]);

  const filteredStores = useMemo(() => {
    const q = storeFilter.trim().toLowerCase();
    if (!q) return storesSortedByLocation;

    return storesSortedByLocation.filter((s) => {
      const haystack = [
        s.storeName ?? "",
        s.city ?? "",
        s.address ?? "",
        s.chain?.chainName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [storesSortedByLocation, storeFilter]);

  const basketItemCodesKey = useMemo(
    () => basket.map((b) => b.itemCode).join(","),
    [basket],
  );

  useEffect(() => {
    basketRef.current = basket;
  }, [basket]);

  // Keep basket prices aligned to selected store
  useEffect(() => {
    const currentBasket = basketRef.current;
    if (!currentBasket.length) return;

    if (!selectedStoreId) {
      const hasStoreSpecificData = currentBasket.some((b) => b.price || b.storeId);
      if (hasStoreSpecificData) {
        const cleared = currentBasket.map((b) => ({
          itemCode: b.itemCode,
          itemName: b.itemName,
        }));
        setBasket(cleared);
        saveBasket(cleared);
      }
      return;
    }

    const storeIdNum = parseInt(selectedStoreId, 10);
    if (Number.isNaN(storeIdNum)) return;

    let cancelled = false;

    async function refreshPricesForSelectedStore() {
      const latestBasket = basketRef.current;
      setLoadingPrices(new Set(latestBasket.map((b) => b.itemCode)));

      const updated = await Promise.all(
        latestBasket.map(async (item) => {
          try {
            const row = await getProductPriceInStore(item.itemCode, storeIdNum);
            return {
              ...item,
              price: row.price,
              storeId: row.storeId,
            };
          } catch {
            return {
              ...item,
              price: undefined,
              storeId: storeIdNum,
            };
          }
        }),
      );

      if (cancelled) return;

      setLoadingPrices(new Set());

      const changed = updated.some(
        (u, idx) =>
          u.price !== latestBasket[idx]?.price ||
          u.storeId !== latestBasket[idx]?.storeId,
      );

      if (changed) {
        setBasket(updated);
        saveBasket(updated);
      }
    }

    refreshPricesForSelectedStore();

    return () => {
      cancelled = true;
    };
  }, [selectedStoreId, basketItemCodesKey]);

  // Debounced search
  const doSearch = useCallback(async (q: string, storeId: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    setShowResults(true);

    try {
      if (storeId) {
        const res = await searchProductsInStore(q, parseInt(storeId, 10));
        setResults([...(res.bestMatch ? [res.bestMatch] : []), ...(res.allOthers ?? [])]);
      } else {
        const res = await searchProducts(q);
        setResults([...(res.bestMatch ? [res.bestMatch] : []), ...(res.allOthers ?? [])]);
      }
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      doSearch(query, selectedStoreId);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedStoreId, doSearch]);

  const addToBasket = (product: Product) => {
    if (basket.some((b) => b.itemCode === product.itemCode)) return;

    const newItem: BasketItem = {
      itemCode: product.itemCode,
      itemName: product.itemName,
    };

    const updated = [...basket, newItem];
    setBasket(updated);
    saveBasket(updated);
    setShowResults(false);
    setQuery("");
  };

  const removeFromBasket = (itemCode: string) => {
    const updated = basket.filter((b) => b.itemCode !== itemCode);
    setBasket(updated);
    saveBasket(updated);
  };

  const total = basket.reduce((sum, item) => {
    const p = parseFloat(item.price ?? "0");
    return sum + (Number.isNaN(p) ? 0 : p);
  }, 0);

  const selectedStore = stores.find((s) => s.id === parseInt(selectedStoreId, 10));

  return (
    <div className="flex flex-1 flex-col">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto pb-36">
        <div className="mx-auto max-w-2xl px-4 pt-8">

          {basket.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <ShoppingCart className="size-12 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">הסל ריק</p>
              <p className="text-sm text-muted-foreground/70">
                חפשו מוצר למטה כדי להוסיף לסל
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">סל קניות</h2>
                {selectedStore && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <StoreIcon className="size-3" />
                    {selectedStore.chain.chainName} / {selectedStore.storeName}
                  </span>
                )}
              </div>
              {/* Basket list */}
              <div className="overflow-hidden rounded-xl border border-border">
                {basket.map((item, idx) => (
                  <div key={item.itemCode}>
                    {idx > 0 && <Separator />}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.itemName}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {item.itemCode}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {loadingPrices.has(item.itemCode) ? (
                          <Loader2 className="size-3 animate-spin text-muted-foreground" />
                        ) : item.price ? (
                          <Badge variant="secondary" className="font-mono">
                            ₪{parseFloat(item.price).toFixed(2)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            ללא מחיר
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeFromBasket(item.itemCode)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results popup */}
      {showResults && (
        <div className="fixed bottom-28 left-0 right-0 z-40 mx-auto w-full max-w-2xl px-4">
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xl">
            {searching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                מחפש...
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                לא נמצאו תוצאות
              </div>
            ) : (
              <>
                <div className="max-h-72 overflow-y-auto overscroll-contain touch-pan-y">
                  {results.map((product, idx) => {
                    const inBasket = basket.some((b) => b.itemCode === product.itemCode);
                    return (
                      <div key={product.itemCode}>
                        {idx > 0 && <Separator />}
                        <button
                          className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/50 disabled:opacity-50"
                          onClick={() => addToBasket(product)}
                          disabled={inBasket}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{product.itemName}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {product.itemCode}
                            </p>
                          </div>
                          {inBasket && (
                            <Badge variant="outline" className="shrink-0 text-xs">
                              בסל
                            </Badge>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                  נמצאו {results.length} תוצאות
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto px-4 py-2 flex justify-between items-center gap-3">

          {/* Right side: store controls + location status */}
          <div className="flex-1 flex flex-col gap-1 max-w-2xl">
            <div className="flex">
              <div className="flex flex-col gap-2">
                {/* Location status */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <LocateFixed className="size-3" />
                    {userLocation
                      ? `ממוין לפי מרחק מ${userLocation.city}`
                      : locationError
                        ? locationError
                        : "מיקום לא זמין"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2.5 text-xs cursor-pointer"
                    onClick={requestUserLocation}
                    disabled={locating}
                  >
                    {locating ? "מאתר..." : "רענן"}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Store list filter */}
                  <Input
                    value={storeFilter}
                    onChange={(e) => setStoreFilter(e.target.value)}
                    placeholder="סינון חנויות לפי שם או עיר..."
                    className="h-8 w-28 text-xs min-w-max"
                  />
                  {/* Store selector */}
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId} dir="rtl">
                    <SelectTrigger className="h-8 w-44 shrink-0 text-xs">
                      <SelectValue placeholder="בחר חנות..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStores.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          לא נמצאו חנויות
                        </div>
                      ) : (
                        filteredStores.map((store) => (
                          <SelectItem key={store.id} value={String(store.id)}>
                            <span className="text-xs">
                              {store.chain.chainName} / {store.storeName}
                              {store.distanceKm !== undefined
                                ? ` · ${store.distanceKm.toFixed(1)} ק"מ`
                                : ""}
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

              </div>

            </div>

          </div>

          {/* Middle: search input */}
          <div className="relative min-w-0 max-w-3xl flex-1">
            <Search className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="חפש מוצר..."
              className="h-9 pr-8 text-sm"
            />
            {query && (
              <button
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setQuery("");
                  setShowResults(false);
                  inputRef.current?.focus();
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Left side: total */}
          <div className="flex-1">
            <div className="flex shrink-0 flex-col items-start">
              <span className="text-[10px] text-muted-foreground">סה״כ</span>
              <span className="font-mono text-sm font-bold">₪{total.toFixed(2)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Click-outside overlay */}
      {showResults && (
        <div className="fixed inset-0 z-30" onClick={() => setShowResults(false)} />
      )}
    </div>
  );
}
