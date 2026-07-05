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
    const [adminRole, setAdminRole] = useState<"admin" | "super_admin" | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            setLoading(false);
        });

        // Discover whether the current user has an admin role.
        // Non-admin users receive a forbidden response and we treat that as null role.
        fetch("/api/admin/me")
            .then(async (res) => {
                if (!res.ok) {
                    setAdminRole(null);
                    return;
                }
                const body = (await res.json()) as { role?: "admin" | "super_admin" };
                setAdminRole(body.role ?? null);
            })
            .catch(() => setAdminRole(null));

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                setAdminRole(null);
            }
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
                <DropdownMenuItem asChild>
                    <Link href="/shopping-list" className="w-full cursor-pointer">
                        רשימת קניות
                    </Link>
                </DropdownMenuItem>
                {adminRole ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/admin/stats" className="w-full cursor-pointer">
                                סטטיסטיקות המערכת
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/admin/messages" className="w-full cursor-pointer">
                                הודעות ממשתמשים
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/admin/users" className="w-full cursor-pointer">
                                כל המשתמשים
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/admin/admins" className="w-full cursor-pointer">
                                כל המנהלים
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/admin/audit" className="w-full cursor-pointer">
                                יומן ביקורת
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/admin/api-keys" className="w-full cursor-pointer">
                                מפתחות API
                            </Link>
                        </DropdownMenuItem>
                    </>
                ) : null}
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
