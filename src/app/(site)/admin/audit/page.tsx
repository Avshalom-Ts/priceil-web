"use client";

import { useEffect, useMemo, useState } from "react";

type AuditItem = {
    id: string;
    action: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    actor: {
        userId: string | null;
        email: string | null;
    };
    target: {
        userId: string | null;
        email: string | null;
    };
};

type AuditResponse = {
    items: AuditItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("he-IL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function metadataPreview(metadata: Record<string, unknown>): string {
    const entries = Object.entries(metadata);
    if (entries.length === 0) return "-";
    return entries
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(" | ");
}

export default function AdminAuditPage() {
    const [items, setItems] = useState<AuditItem[]>([]);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        async function load() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/admin/audit?page=1&limit=100");
                const body = (await response.json()) as AuditResponse & { error?: string };

                if (!response.ok) {
                    throw new Error(body.error ?? "שגיאה בטעינת יומן ביקורת");
                }

                if (!ignore) {
                    setItems(body.items ?? []);
                }
            } catch (err) {
                if (!ignore) {
                    const message = err instanceof Error ? err.message : "שגיאה בטעינת יומן ביקורת";
                    setError(message);
                    setItems([]);
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void load();

        return () => {
            ignore = true;
        };
    }, []);

    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;

        return items.filter((item) => {
            return (
                item.action.toLowerCase().includes(q) ||
                (item.actor.email ?? "").toLowerCase().includes(q) ||
                (item.target.email ?? "").toLowerCase().includes(q) ||
                JSON.stringify(item.metadata).toLowerCase().includes(q)
            );
        });
    }, [items, query]);

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">יומן פעולות</h1>
                <p className="text-sm text-muted-foreground">אירועי ביקורת מטבלת admin_audit_log.</p>
            </header>

            <label className="flex max-w-md flex-col gap-1 text-sm">
                חיפוש לפי פעולה / משתמש / מטא-דאטה
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="rounded-md border bg-background px-3 py-2"
                    placeholder="admin_update_user_access_state"
                />
            </label>

            {isLoading ? <p className="text-sm text-muted-foreground">טוען אירועים...</p> : null}

            {error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {!isLoading && !error ? (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-right">
                            <tr>
                                <th className="px-3 py-2 font-medium">תאריך</th>
                                <th className="px-3 py-2 font-medium">פעולה</th>
                                <th className="px-3 py-2 font-medium">מבצע</th>
                                <th className="px-3 py-2 font-medium">יעד</th>
                                <th className="px-3 py-2 font-medium">metadata</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="border-t align-top">
                                    <td className="px-3 py-2 text-muted-foreground">{formatDate(item.createdAt)}</td>
                                    <td className="px-3 py-2 font-medium">{item.action}</td>
                                    <td className="px-3 py-2">
                                        {item.actor.email ?? item.actor.userId ?? "system"}
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.target.email ?? item.target.userId ?? "-"}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-muted-foreground">
                                        {metadataPreview(item.metadata)}
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                                        לא נמצאו אירועי ביקורת.
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
