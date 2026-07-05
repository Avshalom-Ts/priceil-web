"use client";

import { useEffect, useMemo, useState } from "react";

type StatusFilter = "all" | "active" | "blocked" | "deleted_soft";
type AccessStatus = "active" | "blocked" | "deleted_soft";

type UserItem = {
    userId: string;
    email: string | null;
    createdAt: string | null;
    plan: string;
    monthlyLimit: number;
    monthRequests: number;
    accessState: {
        status: AccessStatus;
        reason: string | null;
        changedAt: string | null;
    };
};

type UsersResponse = {
    items: UserItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

function formatDate(iso: string | null): string {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("he-IL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function statusLabel(status: AccessStatus): string {
    if (status === "blocked") return "חסום";
    if (status === "deleted_soft") return "מחוק רך";
    return "פעיל";
}

export default function AdminUsersPage() {
    const [status, setStatus] = useState<StatusFilter>("all");
    const [users, setUsers] = useState<UserItem[]>([]);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        setIsLoading(true);
        setError(null);

        try {
            const searchParams = new URLSearchParams({
                page: "1",
                limit: "100",
            });

            if (status !== "all") {
                searchParams.set("status", status);
            }

            const response = await fetch(`/api/admin/users?${searchParams.toString()}`);
            const body = (await response.json()) as UsersResponse & { error?: string };

            if (!response.ok) {
                throw new Error(body.error ?? "שגיאה בטעינת משתמשים");
            }

            setUsers(body.items ?? []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "שגיאה בטעינת משתמשים";
            setError(message);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [status]);

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((user) => {
            const email = user.email?.toLowerCase() ?? "";
            return email.includes(q) || user.userId.toLowerCase().includes(q);
        });
    }, [users, query]);

    async function updateUserState(userId: string, nextStatus: AccessStatus) {
        setIsSaving(true);
        setError(null);

        let reason: string | null = null;
        if (nextStatus !== "active") {
            reason = window.prompt("סיבת שינוי (אופציונלי):")?.trim() || null;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: nextStatus,
                    reason,
                }),
            });

            const body = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(body.error ?? "עדכון סטטוס משתמש נכשל");
            }

            await load();
        } catch (err) {
            const message = err instanceof Error ? err.message : "עדכון סטטוס משתמש נכשל";
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
                <p className="text-sm text-muted-foreground">חסימה, ביטול חסימה ומחיקה רכה של משתמשים.</p>
            </header>

            <section className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr]">
                <label className="flex flex-col gap-1 text-sm">
                    סינון לפי סטטוס
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as StatusFilter)}
                        className="rounded-md border bg-background px-3 py-2"
                    >
                        <option value="all">הכל</option>
                        <option value="active">פעילים</option>
                        <option value="blocked">חסומים</option>
                        <option value="deleted_soft">מחוקים רך</option>
                    </select>
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    חיפוש (אימייל / מזהה משתמש)
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="rounded-md border bg-background px-3 py-2"
                        placeholder="example@domain.com"
                    />
                </label>
            </section>

            {error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {isLoading ? <p className="text-sm text-muted-foreground">טוען משתמשים...</p> : null}

            {!isLoading ? (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-right">
                            <tr>
                                <th className="px-3 py-2 font-medium">אימייל</th>
                                <th className="px-3 py-2 font-medium">תוכנית</th>
                                <th className="px-3 py-2 font-medium">שימוש חודשי</th>
                                <th className="px-3 py-2 font-medium">סטטוס</th>
                                <th className="px-3 py-2 font-medium">עודכן</th>
                                <th className="px-3 py-2 font-medium">פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.userId} className="border-t align-top">
                                    <td className="px-3 py-2">
                                        <div className="font-medium">{user.email ?? "-"}</div>
                                        <div className="text-xs text-muted-foreground">{user.userId}</div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div>{user.plan}</div>
                                        <div className="text-xs text-muted-foreground">monthly_limit: {user.monthlyLimit}</div>
                                    </td>
                                    <td className="px-3 py-2">{user.monthRequests}</td>
                                    <td className="px-3 py-2">
                                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                            {statusLabel(user.accessState.status)}
                                        </span>
                                        {user.accessState.reason ? (
                                            <div className="mt-1 text-xs text-muted-foreground">סיבה: {user.accessState.reason}</div>
                                        ) : null}
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground">{formatDate(user.accessState.changedAt)}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                                                onClick={() => updateUserState(user.userId, "active")}
                                                disabled={isSaving || user.accessState.status === "active"}
                                            >
                                                בטל חסימה
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                                                onClick={() => updateUserState(user.userId, "blocked")}
                                                disabled={isSaving || user.accessState.status === "blocked"}
                                            >
                                                חסום
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive disabled:opacity-50"
                                                onClick={() => updateUserState(user.userId, "deleted_soft")}
                                                disabled={isSaving || user.accessState.status === "deleted_soft"}
                                            >
                                                מחיקה רכה
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                                        לא נמצאו משתמשים.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}
