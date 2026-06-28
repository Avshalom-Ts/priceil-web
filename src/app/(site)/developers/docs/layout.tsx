import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { DocsMobileNav, DocsSidebarNav } from "@/components/docs/mobile-nav";

export const navItems = [
    { href: "/developers/docs", label: "סקירה כללית" },
    { href: "/developers/docs/chains", label: "רשתות מזון" },
    { href: "/developers/docs/stores", label: "סניפים ברשת" },
    { href: "/developers/docs/products", label: "מוצרים" },
    { href: "/developers/docs/basket", label: "סל קניות" },
];

export const metadata: Metadata = { title: "מדריכים" }

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-10">
            {/* Hamburger nav — mobile only */}
            <DocsMobileNav navItems={navItems} />

            <div className="flex gap-8">
                {/* Sidebar — desktop only */}
                <aside className="hidden w-52 shrink-0 md:block">
                    <div className="sticky top-20">
                        <DocsSidebarNav navItems={navItems} />
                    </div>
                </aside>

                {/* Content */}
                <main className="min-w-0 flex-1">{children}</main>
            </div>
        </div>
    );
}
