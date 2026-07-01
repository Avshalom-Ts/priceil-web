import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/lib/api";

type SearchResultsPopupProps = {
    results: Array<Product & { price?: string; unitQty?: string }>;
    total: number;
    page: number;
    limit: number;
    searching: boolean;
    showResults: boolean;
    basket: Array<{ itemCode: string }>;
    replacingItemCode: string | null;
    onSelectProduct: (product: Product) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onClose: () => void;
};

export function SearchResultsPopup({
    results,
    total,
    page,
    limit,
    searching,
    showResults,
    basket,
    replacingItemCode,
    onSelectProduct,
    onPrevPage,
    onNextPage,
    onClose,
}: SearchResultsPopupProps) {
    if (!showResults) return null;

    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
    const canGoPrev = page > 1 && !searching;
    const canGoNext = page < totalPages && !searching;

    return (
        <>
            <div className="fixed bottom-40 left-0 right-0 z-40 mx-auto w-full max-w-2xl px-4 sm:bottom-24">
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
                                                onClick={() => onSelectProduct(product)}
                                                disabled={inBasket}
                                            >
                                                <p className="min-w-0 flex-1 truncate text-sm font-medium">
                                                    {product.itemName}
                                                </p>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    {product.price && (
                                                        <div className="flex items-center gap-1">
                                                            <Badge variant="secondary" className="font-mono">
                                                                ₪{parseFloat(product.price).toFixed(2)}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {product.unitQty ?? 'י"ח'}
                                                            </span>
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
                            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={onPrevPage}
                                        disabled={!canGoPrev}
                                        aria-label="עמוד קודם"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                    <span>
                                        עמוד {Math.min(page, totalPages)} מתוך {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={onNextPage}
                                        disabled={!canGoNext}
                                        aria-label="עמוד הבא"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>
                                </div>
                                <span>ס&quot;כ {total} תוצאות</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="fixed inset-0 z-30" onClick={onClose} />
        </>
    );
}
