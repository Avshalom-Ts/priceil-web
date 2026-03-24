import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-lg font-bold tracking-tight">PriceIL</span>
                    <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        BETA
                    </span>
                </Link>

                <nav className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/search">חיפוש מוצרים</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/docs">תיעוד API</Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
