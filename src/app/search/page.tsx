"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, ShoppingCart, Loader2, Store as StoreIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "@/lib/api";

const BASKET_KEY = "priceil_basket";

interface BasketItem {
    itemCode: string;
    itemName: string;
    price?: string;
    storeId?: number;
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

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string>("");

    const [basket, setBasket] = useState<BasketItem[]>([]);
    const [loadingPrices, setLoadingPrices] = useState<Set<string>>(new Set());

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load basket from localStorage on mount
    useEffect(() => {
        setBasket(loadBasket());
    }, []);

    // Load stores
    useEffect(() => {
        getStores()
            .then((res) => setStores(res.items))
            .catch(() => { });
    }, []);

    // Debounced search
    const doSearch = useCallback(
        async (q: string, storeId: string) => {
            if (!q.trim() || q.trim().length < 2) {
                setResults([]);
                setShowResults(false);
                return;
            }
            setSearching(true);
            setShowResults(true);
            try {
                if (storeId) {
                    const res = await searchProductsInStore(q, parseInt(storeId));
                    setResults(res.items);
                } else {
                    const res = await searchProducts(q);
                    setResults(res.items);
                }
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        },
        []
    );

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            doSearch(query, selectedStoreId);
        }, 350);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, selectedStoreId, doSearch]);

    // Add product to basket
    const addToBasket = async (product: Product) => {
        // Don't add duplicates
        if (basket.some((b) => b.itemCode === product.itemCode)) return;

        const newItem: BasketItem = {
            itemCode: product.itemCode,
            itemName: product.itemName,
        };

        // If there's a selected store, fetch price
        if (selectedStoreId) {
            setLoadingPrices((prev) => new Set(prev).add(product.itemCode));
            try {
                const priceData = await getProductPriceInStore(
                    product.itemCode,
                    parseInt(selectedStoreId)
                );
                newItem.price = priceData.price;
                newItem.storeId = priceData.storeId;
            } catch {
                // Price not available – add without price
            } finally {
                setLoadingPrices((prev) => {
                    const next = new Set(prev);
                    next.delete(product.itemCode);
                    return next;
                });
            }
        }

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
        return sum + (isNaN(p) ? 0 : p);
    }, 0);

    const selectedStore = stores.find((s) => s.id === parseInt(selectedStoreId));

    return (
        <div className="flex flex-1 flex-col">
            {/* Main content area */}
            <div className="flex-1 overflow-y-auto pb-28">
                <div className="mx-auto max-w-2xl px-4 pt-8">
                    {basket.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                            <ShoppingCart className="size-12 text-muted-foreground/40" />
                            <p className="text-lg font-medium text-muted-foreground">
                                הסל ריק
                            </p>
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
                                        {selectedStore.storeName} — {selectedStore.city}
                                    </span>
                                )}
                            </div>

                            <div className="rounded-xl border border-border overflow-hidden">
                                {basket.map((item, idx) => (
                                    <div key={item.itemCode}>
                                        {idx > 0 && <Separator />}
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {item.itemName}
                                                </p>
                                                <p className="font-mono text-xs text-muted-foreground">
                                                    {item.itemCode}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
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

            {/* Results popup — sits above the bottom bar */}
            {showResults && (
                <div className="fixed bottom-20 right-0 left-0 z-40 mx-auto w-full max-w-2xl px-4">
                    <div className="rounded-xl border border-border bg-background shadow-xl overflow-hidden">
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
                            <ScrollArea className="max-h-72">
                                {results.map((product, idx) => {
                                    const inBasket = basket.some(
                                        (b) => b.itemCode === product.itemCode
                                    );
                                    return (
                                        <div key={product.itemCode}>
                                            {idx > 0 && <Separator />}
                                            <button
                                                className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/50 disabled:opacity-50"
                                                onClick={() => addToBasket(product)}
                                                disabled={inBasket}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {product.itemName}
                                                    </p>
                                                    <p className="font-mono text-xs text-muted-foreground">
                                                        {product.itemCode}
                                                    </p>
                                                </div>
                                                {inBasket && (
                                                    <Badge variant="outline" className="text-xs shrink-0">
                                                        בסל
                                                    </Badge>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </ScrollArea>
                        )}
                    </div>
                </div>
            )}

            {/* Fixed bottom bar */}
            <div className="fixed bottom-0 right-0 left-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto flex h-16 max-w-2xl items-center gap-2 px-4">
                    {/* Total — leftmost */}
                    <div className="flex shrink-0 flex-col items-end">
                        <span className="text-[10px] text-muted-foreground">סה״כ</span>
                        <span className="font-mono text-sm font-bold">
                            ₪{total.toFixed(2)}
                        </span>
                    </div>

                    <Separator orientation="vertical" className="h-8" />

                    {/* Store selector */}
                    <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                        <SelectTrigger className="h-9 w-44 shrink-0 text-xs">
                            <SelectValue placeholder="בחר חנות..." />
                        </SelectTrigger>
                        <SelectContent>
                            {stores.map((store) => (
                                <SelectItem key={store.id} value={String(store.id)}>
                                    <span className="text-xs">
                                        {store.storeName} — {store.city}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Search input */}
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 -translate-y-1/2 right-2.5 size-4 text-muted-foreground pointer-events-none" />
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
                                className="absolute top-1/2 -translate-y-1/2 left-2.5 text-muted-foreground hover:text-foreground"
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
                </div>
            </div>

            {/* Click-outside to close results */}
            {showResults && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowResults(false)}
                />
            )}
        </div>
    );
}
