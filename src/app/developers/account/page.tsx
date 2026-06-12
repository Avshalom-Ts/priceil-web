'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Calendar, LogIn, TriangleAlert } from "lucide-react";

function getDisplayName(user: User): string {
    return (
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "משתמש"
    );
}

function getInitials(user: User): string {
    return getDisplayName(user)
        .split(/\s+/)
        .slice(0, 2)
        .map((p: string) => p[0]?.toUpperCase() ?? "")
        .join("");
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export default function AccountPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            setLoading(false);
        });
    }, []);

    async function handleDeleteAccount() {
        setDeleting(true);
        setDeleteError(null);
        try {
            const res = await fetch("/api/account/delete", { method: "DELETE" });
            if (!res.ok) {
                const body = await res.json();
                setDeleteError(body.error ?? "אירעה שגיאה. נסה שנית.");
                setDeleting(false);
                return;
            }
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/");
        } catch {
            setDeleteError("אירעה שגיאה. נסה שנית.");
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
                טוען...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
                יש להתחבר כדי לצפות בחשבון
            </div>
        );
    }

    const provider = user.app_metadata?.provider as string | undefined;

    return (
        <div className="container mx-auto max-w-2xl px-4 py-10 flex flex-col gap-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">החשבון שלי</h1>
            </div>

            {/* Profile card */}
            <div className="rounded-xl border bg-card p-6 flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    <Avatar className="size-16 ring-2 ring-border">
                        <AvatarFallback className="text-xl font-bold">
                            {getInitials(user)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                        <span className="text-lg font-semibold">{getDisplayName(user)}</span>
                        <Badge variant="secondary" className="w-fit text-xs capitalize">
                            <Mail className="size-4 shrink-0" />
                            <span className="font-medium text-foreground">{user.email}</span>
                        </Badge>
                    </div>
                </div>
                {user.last_sign_in_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <LogIn className="size-4 shrink-0" />
                        <span>כניסה אחרונה&nbsp;{formatDate(user.last_sign_in_at)}</span>
                    </div>
                )}
            </div>

            {/* Create New API-KEY For App Name */}

            {/* Danger zone */}
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-destructive">
                    <TriangleAlert className="size-5" />
                    <h2 className="font-semibold">אזור מסוכן</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    מחיקת החשבון היא פעולה בלתי הפיכה. כל הנתונים הקשורים לחשבון יימחקו לצמיתות.
                </p>

                {!confirmDelete ? (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-fit"
                        onClick={() => setConfirmDelete(true)}
                    >
                        מחק חשבון
                    </Button>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium text-destructive">
                            האם אתה בטוח? פעולה זו לא ניתנת לביטול.
                        </p>
                        {deleteError && (
                            <p className="text-sm text-destructive">{deleteError}</p>
                        )}
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleting}
                                onClick={handleDeleteAccount}
                            >
                                {deleting ? "מוחק..." : "כן, מחק את החשבון שלי"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={deleting}
                                onClick={() => {
                                    setConfirmDelete(false);
                                    setDeleteError(null);
                                }}
                            >
                                ביטול
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
