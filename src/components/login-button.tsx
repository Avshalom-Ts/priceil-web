"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { ComponentProps, ReactNode } from "react";

type LoginButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
    children?: ReactNode;
    returnTo?: string;
};

function normalizeReturnPath(path: string | undefined): string {
    if (!path) return "/";
    if (!path.startsWith("/") || path.startsWith("//")) return "/";
    return path;
}

export function LoginButton({ children = "התחברות", returnTo, ...props }: LoginButtonProps) {
    async function handleSignIn() {
        const supabase = createClient();
        const currentPath = `${window.location.pathname}${window.location.search}`;
        const nextPath = normalizeReturnPath(returnTo ?? currentPath);
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
            },
        });
    }

    return (
        <Button onClick={handleSignIn} {...props}>
            {children}
        </Button>
    );
}
