'use client';

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Check, Copy, Key, LogIn, Mail, Plus, Trash2, TriangleAlert } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
    id: string;
    name: string;
    created_at: string;
    last_used_at: string | null;
}

interface RegisteredApp {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    api_keys: ApiKey[];
}

interface UserPlan {
    plan: "free" | "basic" | "premium";
    monthly_limit: number; // -1 = unlimited
}

interface AppsData {
    plan: UserPlan;
    usage: number;
    apps: RegisteredApp[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const TIER_LIMITS: Record<string, { maxApps: number; maxKeysPerApp: number }> = {
    free: { maxApps: 1, maxKeysPerApp: 1 },
    basic: { maxApps: 3, maxKeysPerApp: 2 },
    premium: { maxApps: Infinity, maxKeysPerApp: Infinity },
};

const PLAN_LABELS: Record<string, string> = {
    free: "חינם",
    basic: "בסיסי",
    premium: "פרמיום",
};

const DIALOG_OVERLAY =
    "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";

const DIALOG_CONTENT =
    "fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-background p-6 shadow-lg flex flex-col gap-5 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────────────

export default function AccountPage() {
    // existing auth state
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const router = useRouter();

    // apps data
    const [appsData, setAppsData] = useState<AppsData | null>(null);
    const [appsLoading, setAppsLoading] = useState(false);
    const [appsError, setAppsError] = useState<string | null>(null);

    // create app dialog
    const [createAppOpen, setCreateAppOpen] = useState(false);
    const [createAppName, setCreateAppName] = useState("");
    const [createAppDesc, setCreateAppDesc] = useState("");
    const [createAppLoading, setCreateAppLoading] = useState(false);
    const [createAppError, setCreateAppError] = useState<string | null>(null);

    // create key dialog (null = closed; string = appId for which to create key)
    const [createKeyAppId, setCreateKeyAppId] = useState<string | null>(null);
    const [createKeyName, setCreateKeyName] = useState("");
    const [createKeyLoading, setCreateKeyLoading] = useState(false);
    const [createKeyError, setCreateKeyError] = useState<string | null>(null);
    const [newRawKey, setNewRawKey] = useState<string | null>(null);

    // inline destructive confirms
    const [revokeKeyInfo, setRevokeKeyInfo] = useState<{ appId: string; keyId: string } | null>(null);
    const [revokeLoading, setRevokeLoading] = useState(false);
    const [deleteAppId, setDeleteAppId] = useState<string | null>(null);
    const [deleteAppLoading, setDeleteAppLoading] = useState(false);

    // copy feedback
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // ── data loading ──────────────────────────────────────────────────────────

    const loadApps = useCallback(async () => {
        setAppsLoading(true);
        setAppsError(null);
        try {
            const res = await fetch("/api/apps");
            if (!res.ok) {
                const body = await res.json();
                setAppsError(body.error ?? "שגיאה בטעינת הנתונים");
                return;
            }
            setAppsData(await res.json());
        } catch {
            setAppsError("שגיאה בטעינת הנתונים");
        } finally {
            setAppsLoading(false);
        }
    }, []);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            setLoading(false);
            if (data.user) loadApps();
        });
    }, [loadApps]);

    // ── handlers ─────────────────────────────────────────────────────────────

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

    async function handleCreateApp() {
        setCreateAppLoading(true);
        setCreateAppError(null);
        try {
            const res = await fetch("/api/apps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: createAppName.trim(),
                    description: createAppDesc.trim() || undefined,
                }),
            });
            const body = await res.json();
            if (!res.ok) {
                setCreateAppError(body.error ?? "שגיאה ביצירת האפליקציה");
                return;
            }
            setCreateAppOpen(false);
            setCreateAppName("");
            setCreateAppDesc("");
            await loadApps();
        } catch {
            setCreateAppError("שגיאה ביצירת האפליקציה");
        } finally {
            setCreateAppLoading(false);
        }
    }

    async function handleCreateKey() {
        if (!createKeyAppId) return;
        setCreateKeyLoading(true);
        setCreateKeyError(null);
        try {
            const res = await fetch(`/api/apps/${createKeyAppId}/keys`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: createKeyName.trim() }),
            });
            const body = await res.json();
            if (!res.ok) {
                setCreateKeyError(body.error ?? "שגיאה ביצירת המפתח");
                return;
            }
            setNewRawKey(body.key.raw_key);
            setCreateKeyName("");
            await loadApps();
        } catch {
            setCreateKeyError("שגיאה ביצירת המפתח");
        } finally {
            setCreateKeyLoading(false);
        }
    }

    async function handleRevokeKey(appId: string, keyId: string) {
        setRevokeLoading(true);
        try {
            await fetch(`/api/apps/${appId}/keys/${keyId}`, { method: "DELETE" });
            setRevokeKeyInfo(null);
            await loadApps();
        } finally {
            setRevokeLoading(false);
        }
    }

    async function handleDeleteApp(appId: string) {
        setDeleteAppLoading(true);
        try {
            await fetch(`/api/apps/${appId}`, { method: "DELETE" });
            setDeleteAppId(null);
            await loadApps();
        } finally {
            setDeleteAppLoading(false);
        }
    }

    function copyToClipboard(text: string, id: string) {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
        });
    }

    // ── early returns ─────────────────────────────────────────────────────────

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

    const plan = appsData?.plan ?? { plan: "free" as const, monthly_limit: 5000 };
    const limits = TIER_LIMITS[plan.plan] ?? TIER_LIMITS.free;
    const appCount = appsData?.apps.length ?? 0;
    const atAppLimit = limits.maxApps !== Infinity && appCount >= limits.maxApps;

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div className="container mx-auto max-w-2xl px-4 py-10 flex flex-col gap-8">

            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-2">
                    <h1 className="text-2xl font-bold">החשבון שלי</h1>
                    <Badge variant="outline" className="text-xs">
                        בתוכנית {PLAN_LABELS[plan.plan] ?? plan.plan}
                    </Badge>
                </div>
                <Button asChild size="sm" variant="outline" className="gap-2">
                    <Link href="/developers/plans">שדרג תוכנית</Link>
                </Button>
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

            {/* ── API Keys section ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-5">

                {/* Section header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Key className="size-5" />
                        <h2 className="text-lg font-bold">מפתחות API</h2>
                    </div>
                </div>

                {/* Monthly usage bar */}
                {plan.monthly_limit !== -1 ? (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>שימוש החודש</span>
                            <span dir="ltr">
                                {(appsData?.usage ?? 0).toLocaleString("he-IL")}
                                {" / "}
                                {plan.monthly_limit.toLocaleString("he-IL")} בקשות
                            </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{
                                    width: `${Math.min(100, ((appsData?.usage ?? 0) / plan.monthly_limit) * 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">שימוש ללא הגבלה (תוכנית פרמיום)</p>
                )}

                {/* Apps list */}
                {appsLoading ? (
                    <p className="text-sm text-muted-foreground">טוען...</p>
                ) : appsError ? (
                    <p className="text-sm text-destructive">{appsError}</p>
                ) : !appsData || appsData.apps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        אין אפליקציות עדיין. צור אפליקציה כדי להתחיל.
                    </p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {appsData.apps.map((app) => {
                            const atKeyLimit =
                                limits.maxKeysPerApp !== Infinity &&
                                app.api_keys.length >= limits.maxKeysPerApp;
                            const isConfirmingDeleteApp = deleteAppId === app.id;

                            return (
                                <div key={app.id} className="rounded-xl border bg-card overflow-hidden">

                                    {/* App header row */}
                                    <div className="flex items-start justify-between px-4 py-3 bg-muted/30 border-b gap-3">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="font-semibold text-sm">{app.name}</span>
                                            {app.description && (
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {app.description}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                נוצר {formatDate(app.created_at)}
                                            </span>
                                        </div>

                                        {isConfirmingDeleteApp ? (
                                            <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                                <span className="text-xs text-destructive font-medium">
                                                    בטוח למחוק?
                                                </span>
                                                <Button
                                                    variant="destructive"
                                                    size="xs"
                                                    disabled={deleteAppLoading}
                                                    onClick={() => handleDeleteApp(app.id)}
                                                >
                                                    {deleteAppLoading ? "מוחק..." : "מחק"}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    disabled={deleteAppLoading}
                                                    onClick={() => setDeleteAppId(null)}
                                                >
                                                    ביטול
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={() => {
                                                    setDeleteAppId(app.id);
                                                    setRevokeKeyInfo(null);
                                                }}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Keys list */}
                                    {app.api_keys.length > 0 && (
                                        <div className="divide-y">
                                            {app.api_keys.map((apiKey) => {
                                                const isConfirmingRevoke =
                                                    revokeKeyInfo?.keyId === apiKey.id &&
                                                    revokeKeyInfo?.appId === app.id;

                                                return (
                                                    <div
                                                        key={apiKey.id}
                                                        className="px-4 py-2.5 flex items-center gap-2"
                                                    >
                                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                            <span className="text-xs font-medium truncate">
                                                                {apiKey.name}
                                                            </span>
                                                            <code className="text-xs font-mono text-muted-foreground">
                                                                pil_••••••••••••••••••••••••••••••••
                                                            </code>
                                                        </div>

                                                        {isConfirmingRevoke ? (
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <Button
                                                                    variant="destructive"
                                                                    size="xs"
                                                                    disabled={revokeLoading}
                                                                    onClick={() =>
                                                                        handleRevokeKey(app.id, apiKey.id)
                                                                    }
                                                                >
                                                                    {revokeLoading ? "..." : "בטל מפתח"}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="xs"
                                                                    disabled={revokeLoading}
                                                                    onClick={() => setRevokeKeyInfo(null)}
                                                                >
                                                                    ביטול
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                className="text-muted-foreground hover:text-destructive shrink-0"
                                                                onClick={() => {
                                                                    setRevokeKeyInfo({ appId: app.id, keyId: apiKey.id });
                                                                    setDeleteAppId(null);
                                                                }}
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Create key row */}
                                    <div
                                        className={cn(
                                            "px-4 py-2.5 flex items-center gap-3",
                                            app.api_keys.length > 0 && "border-t"
                                        )}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={atKeyLimit}
                                            className="gap-1.5 text-xs h-7 text-muted-foreground"
                                            onClick={() => {
                                                setCreateKeyAppId(app.id);
                                                setCreateKeyName("");
                                                setCreateKeyError(null);
                                                setNewRawKey(null);
                                            }}
                                        >
                                            <Plus className="size-3.5" />
                                            צור מפתח
                                        </Button>
                                        {atKeyLimit && (
                                            <span className="text-xs text-destructive">
                                                הגעת למגבלת המפתחות בתוכנית שלך
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Create App button */}
                <div className="flex flex-col gap-1.5 items-start">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={atAppLimit}
                        onClick={() => {
                            setCreateAppOpen(true);
                            setCreateAppName("");
                            setCreateAppDesc("");
                            setCreateAppError(null);
                        }}
                        className="gap-2"
                    >
                        <Plus className="size-4" />
                        צור אפליקציה חדשה
                    </Button>
                    {atAppLimit && (
                        <p className="text-xs text-destructive">
                            הגעת למגבלת האפליקציות בתוכנית {PLAN_LABELS[plan.plan]}
                        </p>
                    )}
                </div>
            </div>

            <Separator />

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

            {/* ── Create App Dialog ────────────────────────────────────────── */}
            <Dialog.Root
                open={createAppOpen}
                onOpenChange={(open) => { if (!createAppLoading) setCreateAppOpen(open); }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className={DIALOG_OVERLAY} />
                    <Dialog.Content className={DIALOG_CONTENT}>
                        <div className="flex flex-col gap-1">
                            <Dialog.Title className="text-lg font-bold">
                                אפליקציה חדשה
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-muted-foreground">
                                צור אפליקציה כדי להנפיק מפתח API.
                            </Dialog.Description>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="app-name" className="text-sm font-medium">
                                    שם האפליקציה *
                                </label>
                                <Input
                                    id="app-name"
                                    placeholder="לדוגמה: הבוט שלי"
                                    value={createAppName}
                                    onChange={(e) => setCreateAppName(e.target.value)}
                                    disabled={createAppLoading}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !createAppLoading && createAppName.trim())
                                            handleCreateApp();
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="app-desc" className="text-sm font-medium">
                                    תיאור (אופציונלי)
                                </label>
                                <Input
                                    id="app-desc"
                                    placeholder="תיאור קצר של האפליקציה"
                                    value={createAppDesc}
                                    onChange={(e) => setCreateAppDesc(e.target.value)}
                                    disabled={createAppLoading}
                                />
                            </div>
                        </div>

                        {createAppError && (
                            <p className="text-sm text-destructive">{createAppError}</p>
                        )}

                        <div className="flex justify-end gap-2">
                            <Dialog.Close asChild>
                                <Button variant="outline" size="sm" disabled={createAppLoading}>
                                    ביטול
                                </Button>
                            </Dialog.Close>
                            <Button
                                size="sm"
                                disabled={createAppLoading || !createAppName.trim()}
                                onClick={handleCreateApp}
                            >
                                {createAppLoading ? "יוצר..." : "צור אפליקציה"}
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* ── Create Key Dialog ────────────────────────────────────────── */}
            <Dialog.Root
                open={createKeyAppId !== null}
                onOpenChange={(open) => {
                    if (!open && !createKeyLoading) {
                        setCreateKeyAppId(null);
                        setNewRawKey(null);
                        setCreateKeyName("");
                        setCreateKeyError(null);
                    }
                }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className={DIALOG_OVERLAY} />
                    <Dialog.Content className={DIALOG_CONTENT}>
                        {newRawKey ? (
                            /* Step 2 — show raw key once */
                            <>
                                <div className="flex flex-col gap-1">
                                    <Dialog.Title className="text-lg font-bold">
                                        המפתח נוצר בהצלחה
                                    </Dialog.Title>
                                    <Dialog.Description className="text-sm text-muted-foreground">
                                        העתק את המפתח עכשיו — הוא לא יוצג שוב.
                                    </Dialog.Description>
                                </div>

                                <div className="rounded-lg border bg-muted/50 p-3 flex items-center gap-3">
                                    <code className="flex-1 text-xs font-mono break-all leading-relaxed">
                                        {newRawKey}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        className="shrink-0"
                                        onClick={() => copyToClipboard(newRawKey, "new-raw")}
                                    >
                                        {copiedId === "new-raw"
                                            ? <Check className="size-3.5 text-green-500" />
                                            : <Copy className="size-3.5" />
                                        }
                                    </Button>
                                </div>

                                <div className="flex justify-end">
                                    <Dialog.Close asChild>
                                        <Button size="sm">סגור</Button>
                                    </Dialog.Close>
                                </div>
                            </>
                        ) : (
                            /* Step 1 — name the key */
                            <>
                                <div className="flex flex-col gap-1">
                                    <Dialog.Title className="text-lg font-bold">
                                        מפתח API חדש
                                    </Dialog.Title>
                                    <Dialog.Description className="text-sm text-muted-foreground">
                                        תן שם למפתח כדי לזהות אותו בעתיד.
                                    </Dialog.Description>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="key-name" className="text-sm font-medium">
                                        שם המפתח *
                                    </label>
                                    <Input
                                        id="key-name"
                                        placeholder='לדוגמה: "Production" או "Development"'
                                        value={createKeyName}
                                        onChange={(e) => setCreateKeyName(e.target.value)}
                                        disabled={createKeyLoading}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !createKeyLoading && createKeyName.trim())
                                                handleCreateKey();
                                        }}
                                    />
                                </div>

                                {createKeyError && (
                                    <p className="text-sm text-destructive">{createKeyError}</p>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Dialog.Close asChild>
                                        <Button variant="outline" size="sm" disabled={createKeyLoading}>
                                            ביטול
                                        </Button>
                                    </Dialog.Close>
                                    <Button
                                        size="sm"
                                        disabled={createKeyLoading || !createKeyName.trim()}
                                        onClick={handleCreateKey}
                                    >
                                        {createKeyLoading ? "יוצר..." : "צור מפתח"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

        </div>
    );
}
