"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

import { BasketSection } from "@/components/shopping-list/basket-section";
import { SearchResultsPopup } from "@/components/shopping-list/search-results-popup";
import { ShoppingListToolbar } from "@/components/shopping-list/shopping-list-toolbar";
import {
  searchProducts,
  searchProductsInStore,
  getStores,
  getProductPriceInStore,
  type Product,
  type Store,
  getCurrentCity,
} from "@/lib/api";
import {
  type BasketItem,
  type StoreWithDistance,
  type UserLocation,
  citiesMatch,
  haversineKm,
  normalizeCity,
  toBasketItem,
  toNum,
} from "@/lib/shopping-list";

const BASKET_KEY = "priceil_basket";
const STORE_KEY = "priceil_selected_store";
const STORE_FILTER_KEY = "priceil_store_filter";

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

function loadStoreFilter(): string {
  try {
    return localStorage.getItem(STORE_FILTER_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveStoreFilter(value: string) {
  try {
    const next = value.trim();
    if (next) {
      localStorage.setItem(STORE_FILTER_KEY, next);
    } else {
      localStorage.removeItem(STORE_FILTER_KEY);
    }
  } catch {
    // ignore
  }
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

export default function ShoppingListPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<Product & { price?: string; priceUpdateDate?: string; unitQty?: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [allStores, setAllStores] = useState<Store[]>([]);
  const [locationCityStores, setLocationCityStores] = useState<Store[]>([]);
  const [filterApiStores, setFilterApiStores] = useState<Store[]>([]);
  const [storeFilter, setStoreFilter] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [loadingPrices, setLoadingPrices] = useState<Set<string>>(new Set());
  const [replacingItemCode, setReplacingItemCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAttempted, setLocationAttempted] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const basketRef = useRef<BasketItem[]>([]);

  const requestUserLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("המכשיר לא תומך בזיהוי מיקום");
      setLocationCityStores([]);
      setLocationAttempted(true);
      return;
    }

    setLocating(true);
    setLocationAttempted(false);
    setLocationError(null);

    /**
     * Get geolocation and set all stores with distance from user location(city).
     */
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city = await getCurrentCity(pos.coords.latitude, pos.coords.longitude).catch(() => "");
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          city,
        });

        if (city && city !== "Unknown location") {
          try {
            const storeRes = await getStores(city);
            setLocationCityStores(storeRes.items ?? []);
          } catch {
            setLocationCityStores([]);
            // Ignore city-enrichment failures; full store list is still available.
          }
        } else {
          setLocationCityStores([]);
        }

        setLocating(false);
        setLocationAttempted(true);
      },
      () => {
        setLocationError("לא התקבלה הרשאה למיקום");
        setLocationCityStores([]);
        setLocating(false);
        setLocationAttempted(true);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 },
    );
  }, []);

  const handleRefreshStoreSelection = useCallback(() => {
    setSelectedStoreId("");
    setStoreFilter("");
    setLocationCityStores([]);
    saveSelectedStore("");
    requestUserLocation();
  }, [requestUserLocation]);

  // Load basket from localStorage on mount
  useEffect(() => {
    setBasket(loadBasket());
  }, []);

  // Restore selected store from localStorage on mount
  useEffect(() => {
    setSelectedStoreId(loadSelectedStore());
  }, []);

  // Restore store filter from localStorage on mount
  useEffect(() => {
    setStoreFilter(loadStoreFilter());
  }, []);

  // Load stores
  useEffect(() => {
    getStores()
      .then((res) => {
        setAllStores(res.items ?? []);
      })
      .catch(() => { });
  }, []);

  // Persist selected store
  useEffect(() => {
    saveSelectedStore(selectedStoreId);
  }, [selectedStoreId]);

  // Persist store filter
  useEffect(() => {
    saveStoreFilter(storeFilter);
  }, [storeFilter]);

  // Try to get user location on first load (can fail silently)
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Fetch stores by typed filter (city endpoint) so manual search is not
  // limited to the first all-stores page.
  useEffect(() => {
    const q = storeFilter.trim();
    if (!q) {
      setFilterApiStores([]);
      return;
    }

    let cancelled = false;
    getStores(q)
      .then((res) => {
        if (cancelled) return;
        const items = res.items ?? [];
        setFilterApiStores(items);
      })
      .catch(() => {
        if (cancelled) return;
        setFilterApiStores([]);
      });

    return () => {
      cancelled = true;
    };
  }, [storeFilter]);

  // Use a deduped union so manual filter can find city stores that are
  // missing from the first global stores page.
  const availableStores = useMemo<Store[]>(() => {
    const byId = new Map<number, Store>();
    for (const store of allStores) byId.set(store.id, store);
    for (const store of locationCityStores) byId.set(store.id, store);
    return Array.from(byId.values());
  }, [allStores, locationCityStores]);

  const storesSortedByLocation = useMemo<StoreWithDistance[]>(() => {
    const base = [...availableStores] as StoreWithDistance[];

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
  }, [availableStores, userLocation]);

  // Auto-select store when no valid selection exists.
  useEffect(() => {
    if (selectedStoreId) return;
    if (!locationAttempted) return;
    if (availableStores.length === 0) return;

    const locationCity = userLocation?.city ?? "";

    const cityMatch =
      normalizeCity(locationCity).length > 0
        ? locationCityStores.find((store) =>
          citiesMatch(store.city ?? "", locationCity),
        )
        : undefined;

    const nextStore = cityMatch ?? locationCityStores[0] ?? storesSortedByLocation[0];
    if (nextStore) {
      setSelectedStoreId(String(nextStore.id));
    }
  }, [
    selectedStoreId,
    storesSortedByLocation,
    userLocation,
    locationAttempted,
    locationCityStores,
    availableStores.length,
  ]);

  const listFilteredStores = useMemo<StoreWithDistance[]>(() => {
    const q = storeFilter.trim().toLowerCase();
    if (q) {
      const localMatches = availableStores.filter((s) => {
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

      // Merge local text matches with API city-filter matches for fuller results.
      const byId = new Map<number, StoreWithDistance>();
      for (const s of localMatches) {
        byId.set(s.id, s as StoreWithDistance);
      }
      for (const s of filterApiStores) {
        byId.set(s.id, s as StoreWithDistance);
      }

      // Keep currently selected store in list to avoid value flicker while
      // filtered results are being refreshed.
      const selectedId = parseInt(selectedStoreId, 10);
      if (!Number.isNaN(selectedId)) {
        const selected = availableStores.find((s) => s.id === selectedId);
        if (selected) {
          byId.set(selected.id, selected as StoreWithDistance);
        }
      }

      return Array.from(byId.values());
    }

    if (locationCityStores.length > 0 && userLocation) {
      return locationCityStores as StoreWithDistance[];
    }

    return storesSortedByLocation;
  }, [
    storeFilter,
    availableStores,
    filterApiStores,
    selectedStoreId,
    storesSortedByLocation,
    locationCityStores,
    userLocation,
  ]);

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
      return; // No store selected — preserve whatever prices are cached
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
          ? { ...toBasketItem(product, b.qty ?? 1) }
          : b,
      );
      setReplacingItemCode(null);
    } else {
      if (basket.some((b) => b.itemCode === product.itemCode)) return;
      updated = [...basket, toBasketItem(product)];
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

  const selectedStore = availableStores.find((s) => s.id === parseInt(selectedStoreId, 10));
  const selectedStoreLabel = selectedStore
    ? `${selectedStore.chain.chainName} / ${selectedStore.storeName}`
    : null;

  return (
    <div className="flex flex-1 flex-col">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto pb-44 sm:pb-28">
        <div className="mx-auto max-w-2xl px-4 pt-8">

          <BasketSection
            basket={basket}
            selectedStoreLabel={selectedStoreLabel}
            selectedStoreId={selectedStoreId}
            loadingPrices={loadingPrices}
            copied={copied}
            onCopyBasketToClipboard={copyBasketToClipboard}
            onRemoveFromBasket={removeFromBasket}
            onUpdateQty={updateQty}
            onReplaceItem={(itemCode, itemName) => {
              setReplacingItemCode(itemCode);
              setQuery(itemName);
              inputRef.current?.focus();
            }}
          />
        </div>
      </div>

      <ShoppingListToolbar
        query={query}
        storeFilter={storeFilter}
        selectedStoreId={selectedStoreId}
        selectedStoreLabel={selectedStoreLabel}
        total={total}
        userLocation={userLocation}
        locationError={locationError}
        locating={locating}
        listFilteredStores={listFilteredStores}
        onQueryChange={setQuery}
        onClearQuery={() => {
          setQuery("");
          setShowResults(false);
          setReplacingItemCode(null);
          inputRef.current?.focus();
        }}
        onStoreFilterChange={setStoreFilter}
        onStoreChange={setSelectedStoreId}
        onRefreshStoreSelection={handleRefreshStoreSelection}
        inputRef={inputRef}
      />

      {/* Click-outside overlay */}
      <SearchResultsPopup
        results={results}
        searching={searching}
        showResults={showResults}
        basket={basket}
        replacingItemCode={replacingItemCode}
        onSelectProduct={addToBasket}
        onClose={() => setShowResults(false)}
      />
    </div>
  );
}
