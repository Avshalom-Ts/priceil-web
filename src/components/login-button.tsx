"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LoginButton() {
    const pathname = usePathname();
    if (pathname !== "/developers") return null;
    return (
        <Button asChild variant="outline" size="sm">
            <Link href="/sign-in">התחברות</Link>
        </Button>
    );
}
