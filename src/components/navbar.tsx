import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex flex-row-reverse h-16 max-w-5xl items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight">PriceIL</span>
                    <span className="rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        BETA
                    </span>
                </Link>

                <nav className="flex items-center gap-1">
                    {/* <Button asChild variant="ghost" size="default">
                        <Link href="/search">חיפוש מוצרים</Link>
                    </Button> */}
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}
