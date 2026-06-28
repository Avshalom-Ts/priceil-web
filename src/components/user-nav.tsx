"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { LoginButton } from "@/components/login-button";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(user: User): string {
    const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "";
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase() ?? "")
        .join("");
}

export function UserNav() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    }

    const isOnDevelopers = pathname.startsWith("/developers");

    if (loading || (!isOnDevelopers && !user)) return null;

    // If the user is not logged in, show the login button. Otherwise, show the user menu with account and logout options.
    if (!user) {
        return <LoginButton variant="outline" size="sm" />;
    }

    const initials = getInitials(user);

    return (
        <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
                <Avatar className="size-8 cursor-pointer ring-2 ring-border hover:ring-primary transition-all">
                    <AvatarFallback className="text-xs font-semibold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                    <Link href="/developers/account" className="w-full cursor-pointer">
                        החשבון שלי
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/developers/docs" className="w-full cursor-pointer">
                        השימוש ב - API
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive cursor-pointer"
                >
                    התנתקות
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
