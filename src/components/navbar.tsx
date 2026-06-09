import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginButton } from "@/components/login-button";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex flex-row-reverse h-16 max-w-5xl items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight">PriceIL</span>
                </Link>

                <nav className="flex items-center gap-1">
                    <LoginButton />
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}
