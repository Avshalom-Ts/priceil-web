"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { ComponentProps } from "react";

type SignInButtonProps = Omit<ComponentProps<typeof Button>, "onClick">;

export function SignInButton({ children, ...props }: SignInButtonProps) {
    async function handleSignIn() {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    }

    return (
        <Button onClick={handleSignIn} {...props}>
            {children}
        </Button>
    );
}
