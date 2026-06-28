"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";



export function DocsMobileNav({ navItems }: { navItems: { href: string; label: string }[] }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative mb-4 md:hidden">
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            {open && (
                <>
                    {/* Click-outside overlay */}
                    <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                        <nav className="flex flex-col p-1">
                            {navItems.map(({ href, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    {label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </>
            )}
        </div>
    );
}
