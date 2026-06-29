"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Search,
  X,
  ShoppingCart,
  Loader2,
  Store as StoreIcon,
  LocateFixed,
  AlertTriangle,
  Copy,
  Check,
  Plus,
  Minus,
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
const STORE_KEY = "priceil_selected_store";

function loadSelectedStore(): string {
  try {
    return localStorage.getItem(STORE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveSelectedStore(storeId: string) {
  try {
    if (storeId) {
      localStorage.setItem(STORE_KEY, storeId);
    } else {
      localStorage.removeItem(STORE_KEY);
    }
  } catch {
    // ignore
  }
}

interface BasketItem {
  itemCode: string;
  itemName: string;
  qty: number;
  price?: string;
  priceUpdateDate?: string;
  storeId?: number;
  unitQty?: string;
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
  const [results, setResults] = useState<Array<Product & { price?: string; priceUpdateDate?: string; unitQty?: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [stores, setStores] = useState<Store[]>([]);
  const [storeFilter, setStoreFilter] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [storeHydrated, setStoreHydrated] = useState(false);

  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [loadingPrices, setLoadingPrices] = useState<Set<string>>(new Set());
  const [replacingItemCode, setReplacingItemCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  // Load basket and selected store from localStorage on mount.
  // Pre-populate loadingPrices only for items that are missing a price for the
  // saved store so items already priced don't flash a spinner.
  useEffect(() => {
    const savedBasket = loadBasket();
    const savedStoreId = loadSelectedStore();

    if (savedStoreId && savedBasket.length) {
      const savedStoreIdNum = parseInt(savedStoreId, 10);
      const needsPrice = savedBasket
        .filter((b) => !b.price || b.storeId !== savedStoreIdNum)
        .map((b) => b.itemCode);
      if (needsPrice.length) {
        setLoadingPrices(new Set(needsPrice));
      }
    }

    setBasket(savedBasket);
    setSelectedStoreId(savedStoreId);
    setStoreHydrated(true);
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
          qty: b.qty ?? 1,
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

      // Only fetch items that don't already have a price for this store.
      // This prevents all items from spinning whenever a single item is added.
      // When the store changes, every item's storeId is stale so all are included.
      const itemsToFetch = latestBasket.filter(
        (item) => !item.price || item.storeId !== storeIdNum,
      );

      if (!itemsToFetch.length) {
        setLoadingPrices(new Set());
        return;
      }

      setLoadingPrices(new Set(itemsToFetch.map((b) => b.itemCode)));

      const fetchedEntries = await Promise.all(
        itemsToFetch.map(async (item) => {
          try {
            const row = await getProductPriceInStore(item.itemCode, storeIdNum);
            return [item.itemCode, { price: row.price, priceUpdateDate: row.priceUpdateDate, storeId: row.storeId }] as const;
          } catch {
            return [item.itemCode, { price: undefined as string | undefined, priceUpdateDate: undefined as string | undefined, storeId: storeIdNum }] as const;
          }
        }),
      );

      if (cancelled) return;

      setLoadingPrices(new Set());

      const fetchedMap = new Map(fetchedEntries);
      const updated = latestBasket.map((item) => {
        const fetched = fetchedMap.get(item.itemCode);
        return fetched ? { ...item, ...fetched } : item;
      });

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
  }, [selectedStoreId, basketItemCodesKey, storeHydrated]);

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
    let updated: BasketItem[];

    if (replacingItemCode) {
      // Replace mode: swap the no-price item with the selected product
      if (
        basket.some(
          (b) => b.itemCode === product.itemCode && b.itemCode !== replacingItemCode,
        )
      )
        return;
      updated = basket.map((b) =>
        b.itemCode === replacingItemCode
          ? { itemCode: product.itemCode, itemName: product.itemName, qty: b.qty ?? 1, unitQty: (product as { unitQty?: string }).unitQty, priceUpdateDate: (product as { priceUpdateDate?: string }).priceUpdateDate }
          : b,
      );
      setReplacingItemCode(null);
    } else {
      if (basket.some((b) => b.itemCode === product.itemCode)) return;
      updated = [...basket, { itemCode: product.itemCode, itemName: product.itemName, qty: 1, unitQty: (product as { unitQty?: string }).unitQty, priceUpdateDate: (product as { priceUpdateDate?: string }).priceUpdateDate }];
    }

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

  const updateQty = (itemCode: string, newQty: number) => {
    if (newQty < 1) {
      removeFromBasket(itemCode);
      return;
    }
    const updated = basket.map((b) =>
      b.itemCode === itemCode ? { ...b, qty: newQty } : b,
    );
    setBasket(updated);
    saveBasket(updated);
  };

  const copyBasketToClipboard = () => {
    const storeName = selectedStore
      ? `${selectedStore.chain.chainName} / ${selectedStore.storeName}`
      : null;

    const lines = basket.map((item) => {
      const qty = item.qty ?? 1;
      const price = item.price
        ? `₪${parseFloat(item.price).toFixed(2)} ${item.unitQty ?? 'י"ח'}`
        : "מחיר לא זמין";
      return `${item.itemName} - ×${qty} - ${price}`;
    });

    const header = storeName ? `סל קניות ב${storeName}:\n` : "סל קניות:\n";
    const text = header + lines.join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { });
  };

  const total = basket.reduce((sum, item) => {
    const p = parseFloat(item.price ?? "0");
    const q = item.qty ?? 1;
    return sum + (Number.isNaN(p) ? 0 : p * q);
  }, 0);

  const selectedStore = stores.find((s) => s.id === parseInt(selectedStoreId, 10));

  return (
    <div className="flex flex-1 flex-col">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto pb-44 sm:pb-28">
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
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold">סל קניות</h2>
                  {selectedStore && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <StoreIcon className="size-3" />
                      {selectedStore.chain.chainName} / {selectedStore.storeName}
                    </span>
                  )}
                </div>
                {/* Copy to clipboard */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                  onClick={copyBasketToClipboard}
                >
                  {copied ? (
                    <Check className="size-3 text-green-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copied ? "הועתק!" : "העתק"}
                </Button>
              </div>
              {/* Basket list */}
              <div className="overflow-hidden rounded-xl border border-border">
                {basket.map((item, idx) => {
                  const notFoundInStore =
                    !!selectedStoreId &&
                    !loadingPrices.has(item.itemCode) &&
                    !item.price;
                  const handleSearchForItem = () => {
                    setReplacingItemCode(item.itemCode);
                    setQuery(item.itemName);
                    inputRef.current?.focus();
                  };

                  return (
                    <div key={item.itemCode}>
                      {idx > 0 && <Separator />}
                      <div
                        className={`flex items-center ${notFoundInStore ? " bg-amber-500/5" : ""}`}
                      >
                        {/* Qty stepper panel — right edge (first in DOM = visually right in RTL) */}
                        <div className="flex flex-col items-center justify-center border-l px-2 py-1 gap-0.5 min-w-9">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => updateQty(item.itemCode, (item.qty ?? 1) + 1)}
                            className="text-muted-foreground h-6 w-7"
                          >
                            <Plus className="size-3" />
                          </Button>
                          <span className="text-sm tabular-nums font-medium leading-none">{item.qty ?? 1}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => updateQty(item.itemCode, (item.qty ?? 1) - 1)}
                            className="text-muted-foreground h-6 w-7"
                          >
                            <Minus className="size-3" />
                          </Button>
                        </div>
                        {/* Main content */}
                        <div className="flex flex-1 flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                          <div
                            className={`sm:min-w-0 sm:flex-1${notFoundInStore ? " cursor-pointer" : ""}`}
                            onClick={notFoundInStore ? handleSearchForItem : undefined}
                          >
                            <p
                              className={`text-sm font-medium leading-snug wrap-break-word sm:truncate${notFoundInStore ? " text-muted-foreground" : ""}`}
                            >
                              {item.itemName}
                            </p>
                            {notFoundInStore && (
                              <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
                                המוצר לא נמצא בחנות הנבחרת
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:shrink-0 sm:gap-3">
                            <div className="flex-1 sm:flex-none">
                              {loadingPrices.has(item.itemCode) ? (
                                <Loader2 className="size-3 animate-spin text-muted-foreground" />
                              ) : item.price ? (
                                <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 sm:flex-col sm:items-end sm:gap-0.5">
                                  <div className="flex items-center gap-1">
                                    <Badge variant="secondary" className="font-mono">
                                      ₪{parseFloat(item.price).toFixed(2)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{item.unitQty ?? 'י"ח'}</span>
                                  </div>
                                  {item.priceUpdateDate && (
                                    <span className="text-xs text-muted-foreground/70">
                                      <span className="hidden sm:inline">עודכן לאחרונה בתאריך: </span>
                                      {new Date(item.priceUpdateDate).toLocaleDateString("he-IL", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "2-digit",
                                      })}
                                    </span>
                                  )}
                                </div>
                              ) : notFoundInStore ? (
                                <button
                                  onClick={handleSearchForItem}
                                  className="flex items-center gap-1 text-xs text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 cursor-pointer"
                                >
                                  <AlertTriangle className="size-3" />
                                  <span>החלף</span>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeFromBasket(item.itemCode)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results popup */}
      {showResults && (
        <div className="fixed bottom-40 sm:bottom-24 left-0 right-0 z-40 mx-auto w-full max-w-2xl px-4">
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
                    const inBasket = basket.some(
                      (b) =>
                        b.itemCode === product.itemCode &&
                        b.itemCode !== replacingItemCode,
                    );
                    return (
                      <div key={product.itemCode}>
                        {idx > 0 && <Separator />}
                        <button
                          className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/50 disabled:opacity-50"
                          onClick={() => addToBasket(product)}
                          disabled={inBasket}
                        >
                          <p className="min-w-0 flex-1 truncate text-sm font-medium">{product.itemName}</p>
                          <div className="flex shrink-0 items-center gap-2">
                            {product.price && (
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="font-mono">
                                  ₪{parseFloat(product.price).toFixed(2)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{product.unitQty ?? 'י"ח'}</span>
                              </div>
                            )}
                            {inBasket && (
                              <Badge variant="outline" className="text-xs">
                                בסל
                              </Badge>
                            )}
                          </div>
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
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto px-4 py-2 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center sm:gap-3">

          {/* Right side: store controls + location status */}
          <div className="flex flex-col gap-1 sm:flex-1 sm:max-w-2xl">
            <div className="flex">
              <div className="flex-1 sm:flex-0 flex flex-col gap-2">
                {/* Location status */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 min-w-0 truncate">
                    <LocateFixed className="size-3 shrink-0" />
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
                    className="h-8 w-20 shrink-0 text-xs sm:w-28 sm:min-w-max"
                  />
                  {/* Store selector */}
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId} dir="rtl">
                    <SelectTrigger className="h-8 min-w-0 flex-1 text-xs sm:w-44 sm:flex-none">
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
                  setReplacingItemCode(null);
                  inputRef.current?.focus();
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Left side: total */}
          <div className="shrink-0 sm:flex-1 flex sm:justify-start justify-center">
            <div className="flex shrink-0 sm:flex-col gap-3 sm:gap-0 items-end sm:items-start">
              <span className="text-sm text-muted-foreground">סה״כ</span>
              <span className="font-mono text-base font-bold">₪{total.toFixed(2)}</span>
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
