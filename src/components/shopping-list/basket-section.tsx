import { AlertTriangle, Check, Copy, Loader2, Minus, Plus, ShoppingCart, Store as StoreIcon, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { BasketItem } from "@/lib/shopping-list";
import { formatBasketPrice } from "@/lib/shopping-list";

type BasketSectionProps = {
    basket: BasketItem[];
    selectedStoreLabel: string | null;
    selectedStoreId: string;
    loadingPrices: Set<string>;
    copied: boolean;
    onCopyBasketToClipboard: () => void;
    onRemoveFromBasket: (itemCode: string) => void;
    onUpdateQty: (itemCode: string, newQty: number) => void;
    onReplaceItem: (itemCode: string, itemName: string) => void;
};

export function BasketSection({
    basket,
    selectedStoreLabel,
    selectedStoreId,
    loadingPrices,
    copied,
    onCopyBasketToClipboard,
    onRemoveFromBasket,
    onUpdateQty,
    onReplaceItem,
}: BasketSectionProps) {
    if (basket.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <ShoppingCart className="size-12 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">הסל ריק</p>
                <p className="text-sm text-muted-foreground/70">
                    חפשו מוצר למטה כדי להוסיף לסל
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">סל קניות</h2>
                    {selectedStoreLabel && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <StoreIcon className="size-3" />
                            {selectedStoreLabel}
                        </span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                    onClick={onCopyBasketToClipboard}
                >
                    {copied ? (
                        <Check className="size-3 text-green-500" />
                    ) : (
                        <Copy className="size-3" />
                    )}
                    {copied ? "הועתק!" : "העתק"}
                </Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
                {basket.map((item, idx) => {
                    const notFoundInStore =
                        !!selectedStoreId &&
                        !loadingPrices.has(item.itemCode) &&
                        !item.price;

                    const handleSearchForItem = () => {
                        onReplaceItem(item.itemCode, item.itemName);
                    };

                    return (
                        <div key={item.itemCode}>
                            {idx > 0 && <Separator />}
                            <div
                                className={`flex items-stretch${notFoundInStore ? " bg-amber-500/5" : ""}`}
                            >
                                <div className="flex min-w-9 flex-col items-center justify-center gap-0.5 border-l px-2 py-1">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => onUpdateQty(item.itemCode, (item.qty ?? 1) + 1)}
                                        className="h-6 w-7 text-muted-foreground"
                                    >
                                        <Plus className="size-3" />
                                    </Button>
                                    <span className="font-medium leading-none tabular-nums text-sm">
                                        {item.qty ?? 1}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => onUpdateQty(item.itemCode, (item.qty ?? 1) - 1)}
                                        className="h-6 w-7 text-muted-foreground"
                                    >
                                        <Minus className="size-3" />
                                    </Button>
                                </div>
                                <div className="flex flex-1 flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                                    <div
                                        className={`sm:min-w-0 sm:flex-1${notFoundInStore ? " cursor-pointer" : ""}`}
                                        onClick={notFoundInStore ? handleSearchForItem : undefined}
                                    >
                                        <p
                                            className={`wrap-break-word text-sm font-medium leading-snug sm:truncate${notFoundInStore ? " text-muted-foreground" : ""}`}
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
                                                            {formatBasketPrice(item.price)}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.unitQty ?? "י\"ח"}
                                                        </span>
                                                    </div>
                                                    {item.priceUpdateDate && (
                                                        <span className="text-xs text-muted-foreground/70">
                                                            <span className="hidden sm:inline">עודכן לאחרונה בתאריך: </span>
                                                            {new Date(item.priceUpdateDate).toLocaleDateString(
                                                                "he-IL",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "2-digit",
                                                                },
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : notFoundInStore ? (
                                                <button
                                                    onClick={handleSearchForItem}
                                                    className="flex cursor-pointer items-center gap-1 text-xs text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
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
                                    onClick={() => onRemoveFromBasket(item.itemCode)}
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
