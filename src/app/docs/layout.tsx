import Link from "next/link";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/docs", label: "סקירה כללית" },
    { href: "/docs/products", label: "מוצרים" },
    { href: "/docs/stores", label: "חנויות" },
    { href: "/docs/basket", label: "סל קניות" },
];

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto flex w-full max-w-5xl flex-1 gap-8 px-4 py-10">
            {/* Sidebar */}
            <aside className="hidden w-52 shrink-0 md:block">
                <div className="sticky top-20">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        תוכן עניינים
                    </p>
                    <nav className="flex flex-col gap-0.5">
                        {navItems.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                    <div className="mt-6 rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                        <span className="mb-1 block font-semibold text-foreground">
                            Base URL
                        </span>
                        <code className="break-all font-mono text-[11px]">
                            https://api.priceil.com
                        </code>
                    </div>
                </div>
            </aside>

            {/* Content */}
            <main className="min-w-0 flex-1">{children}</main>
        </div>
    );
}
