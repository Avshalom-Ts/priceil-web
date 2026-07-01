import { LocateFixed, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { StoreWithDistance, UserLocation } from "@/lib/shopping-list";

type ShoppingListToolbarProps = {
    query: string;
    storeFilter: string;
    selectedStoreId: string;
    selectedStoreLabel: string | null;
    total: number;
    userLocation: UserLocation | null;
    locationError: string | null;
    locating: boolean;
    listFilteredStores: StoreWithDistance[];
    onQueryChange: (value: string) => void;
    onClearQuery: () => void;
    onStoreFilterChange: (value: string) => void;
    onStoreChange: (value: string) => void;
    onRefreshStoreSelection: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
};

export function ShoppingListToolbar({
    query,
    storeFilter,
    selectedStoreId,
    selectedStoreLabel,
    total,
    userLocation,
    locationError,
    locating,
    listFilteredStores,
    onQueryChange,
    onClearQuery,
    onStoreFilterChange,
    onStoreChange,
    onRefreshStoreSelection,
    inputRef,
}: ShoppingListToolbarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
            <div className="mx-auto flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex flex-col gap-1 sm:flex-1">
                    <div className="flex">
                        <div className="flex flex-1 flex-col gap-2 sm:flex-0">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex min-w-0 items-center gap-1 truncate">
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
                                    className="h-6 cursor-pointer px-2.5 text-xs"
                                    onClick={onRefreshStoreSelection}
                                    disabled={locating}
                                >
                                    {locating ? "מאתר..." : "רענן"}
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Input
                                    value={storeFilter}
                                    onChange={(e) => onStoreFilterChange(e.target.value)}
                                    placeholder="סינון חנויות לפי שם או עיר..."
                                    className="h-8 w-20 shrink-0 text-xs sm:w-28 sm:min-w-max"
                                />
                                <Select value={selectedStoreId} onValueChange={onStoreChange} dir="rtl">
                                    <SelectTrigger className="h-8 min-w-0 flex-1 text-xs sm:w-44 sm:flex-none">
                                        <SelectValue placeholder="בחר חנות..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {listFilteredStores.length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-muted-foreground">
                                                לא נמצאו חנויות
                                            </div>
                                        ) : (
                                            listFilteredStores.map((store) => (
                                                <SelectItem key={store.id} value={String(store.id)}>
                                                    <span className="text-xs">
                                                        {store.chain.chainName} / {store.storeName}
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

                <div className="relative min-w-0 max-w-3xl flex-1">
                    <Search className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder="חפש מוצר..."
                        className="h-9 pr-8 text-sm"
                    />
                    {query && (
                        <button
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={onClearQuery}
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                <div className="shrink-0 sm:flex-1 flex justify-center sm:justify-start">
                    <div className="flex shrink-0 items-end gap-3 sm:flex-col sm:items-start sm:gap-0">
                        <span className="text-sm text-muted-foreground">סה״כ</span>
                        <span className="font-mono text-base font-bold">₪{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            {selectedStoreLabel ? (
                <div className="mx-auto max-w-2xl px-4 pb-2 text-xs text-muted-foreground sm:hidden">
                    {selectedStoreLabel}
                </div>
            ) : null}
        </div>
    );
}
