"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type AdminRole = "admin" | "super_admin";

type AdminItem = {
    userId: string;
    email: string | null;
    role: AdminRole;
    createdAt: string;
};

type AdminMeResponse = {
    userId: string;
    email: string | null;
    role: AdminRole;
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("he-IL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminAdminsPage() {
    const [admins, setAdmins] = useState<AdminItem[]>([]);
    const [myRole, setMyRole] = useState<AdminRole | null>(null);
    const [targetEmail, setTargetEmail] = useState("");
    const [newRole, setNewRole] = useState<AdminRole>("admin");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSuperAdmin = myRole === "super_admin";
    const sortedAdmins = useMemo(
        () => [...admins].sort((a, b) => (a.role === b.role ? 0 : a.role === "super_admin" ? -1 : 1)),
        [admins],
    );

    async function load() {
        setIsLoading(true);
        setError(null);

        try {
            const [adminsResponse, meResponse] = await Promise.all([
                fetch("/api/admin/admins", { cache: "no-store" }),
                fetch("/api/admin/me", { cache: "no-store" }),
            ]);

            const adminsBody = (await adminsResponse.json()) as { items?: AdminItem[]; error?: string };
            const meBody = (await meResponse.json()) as AdminMeResponse & { error?: string };

            if (!adminsResponse.ok) {
                throw new Error(adminsBody.error ?? "שגיאה בטעינת רשימת המנהלים");
            }

            if (!meResponse.ok) {
                throw new Error(meBody.error ?? "שגיאה בזיהוי ההרשאות שלך");
            }

            setAdmins(adminsBody.items ?? []);
            setMyRole(meBody.role);
        } catch (err) {
            const message = err instanceof Error ? err.message : "שגיאה בטעינת רשימת המנהלים";
            setError(message);
            setAdmins([]);
            setMyRole(null);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function handleCreateOrPromote(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!isSuperAdmin) return;
        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/admin/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetEmail,
                    role: newRole,
                }),
            });

            const body = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(body.error ?? "הענקת הרשאה נכשלה");
            }

            setTargetEmail("");
            await load();
        } catch (err) {
            const message = err instanceof Error ? err.message : "הענקת הרשאה נכשלה";
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }

    async function updateRole(userId: string, role: AdminRole) {
        if (!isSuperAdmin) return;
        setError(null);
        setIsSaving(true);

        try {
            const response = await fetch("/api/admin/admins", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role }),
            });

            const body = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(body.error ?? "עדכון הרשאה נכשל");
            }

            await load();
        } catch (err) {
            const message = err instanceof Error ? err.message : "עדכון הרשאה נכשל";
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }

    async function removeAdmin(userId: string) {
        if (!isSuperAdmin) return;
        setError(null);
        setIsSaving(true);

        try {
            const response = await fetch("/api/admin/admins", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const body = (await response.json()) as { error?: string };
            if (!response.ok) {
                if (response.status === 404) {
                    // Keep UI in sync when the row is already gone server-side.
                    await load();
                }
                throw new Error(body.error ?? "ביטול הרשאה נכשל");
            }

            await load();
        } catch (err) {
            const message = err instanceof Error ? err.message : "ביטול הרשאה נכשל";
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">כל המנהלים</h1>
                <p className="text-sm text-muted-foreground">ניהול כל המנהלים במערכת.</p>
            </header>

            {myRole === "admin" ? (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                    יש לך הרשאות צפייה בלבד במסך זה.
                </div>
            ) : null}

            <form onSubmit={handleCreateOrPromote} className="grid gap-3 rounded-lg border p-4 items-end sm:grid-cols-[2fr_1fr_auto]">
                <label className="flex flex-col gap-1 text-sm">
                    אימייל משתמש
                    <input
                        type="email"
                        required
                        value={targetEmail}
                        onChange={(event) => setTargetEmail(event.target.value)}
                        className="rounded-md border bg-background px-3 py-2"
                        placeholder="admin@example.com"
                        disabled={!isSuperAdmin || isSaving}
                    />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    תפקיד
                    <select
                        value={newRole}
                        onChange={(event) => setNewRole(event.target.value as AdminRole)}
                        className="rounded-md border bg-background px-3 py-2"
                        disabled={!isSuperAdmin || isSaving}
                    >
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                    </select>
                </label>

                <button
                    type="submit"
                    className="h-10 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:opacity-60"
                    disabled={!isSuperAdmin || isSaving}
                >
                    {isSaving ? "שומר..." : "הענק/עדכן הרשאה"}
                </button>
            </form>

            {error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {isLoading ? <p className="text-sm text-muted-foreground">טוען מנהלים...</p> : null}

            {!isLoading ? (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-right">
                            <tr>
                                <th className="px-3 py-2 font-medium">אימייל</th>
                                <th className="px-3 py-2 font-medium">תפקיד</th>
                                <th className="px-3 py-2 font-medium">נוסף בתאריך</th>
                                <th className="px-3 py-2 font-medium">פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAdmins.map((item) => (
                                <tr key={item.userId} className="border-t align-middle">
                                    <td className="px-3 py-2">{item.email ?? item.userId}</td>
                                    <td className="px-3 py-2">
                                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                            {item.role}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground">{formatDate(item.createdAt)}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                className="rounded border px-2 py-1 text-xs disabled:opacity-50 cursor-pointer disabled:cursor-auto"
                                                onClick={() => updateRole(item.userId, "admin")}
                                                disabled={!isSuperAdmin || isSaving || item.role === "admin"}
                                            >
                                                הפוך ל-admin
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded border px-2 py-1 text-xs disabled:opacity-50 cursor-pointer disabled:cursor-auto"
                                                onClick={() => updateRole(item.userId, "super_admin")}
                                                disabled={!isSuperAdmin || isSaving || item.role === "super_admin"}
                                            >
                                                הפוך ל-super_admin
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive disabled:opacity-50 cursor-pointer disabled:cursor-auto"
                                                onClick={() => removeAdmin(item.userId)}
                                                disabled={!isSuperAdmin || isSaving}
                                            >
                                                בטל הרשאה
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sortedAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                                        לא נמצאו מנהלים.
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
