import Link from "next/link";
import { cn } from "@/lib/utils";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = { title: "מדריכים" }

const navItems = [
    { href: "/developers/docs", label: "סקירה כללית" },
    { href: "/developers/docs/chains", label: "רשתות מזון" },
    { href: "/developers/docs/stores", label: "סניפים ברשת" },
    { href: "/developers/docs/products", label: "מוצרים" },
    { href: "/developers/docs/basket", label: "סל קניות" },
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
                </div>
            </aside>

            {/* Content */}
            <main className="min-w-0 flex-1">{children}</main>
        </div>
    );
}
