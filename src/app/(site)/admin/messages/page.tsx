"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type StatusFilter = "unread" | "read" | "all";

type InboxItem = {
    id: string;
    user_id: string;
    sender_name: string;
    sender_email: string;
    subject: string;
    status: "unread" | "read";
    created_at: string;
    read_at: string | null;
};

type InboxResponse = {
    items: InboxItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    filter: StatusFilter;
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

function filterLabel(filter: StatusFilter): string {
    if (filter === "unread") return "לא נקראו";
    if (filter === "read") return "נקראו";
    return "הכל";
}

export default function AdminMessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const queryStatus = searchParams.get("status");
    const initialStatus: StatusFilter =
        queryStatus === "read" || queryStatus === "all" || queryStatus === "unread"
            ? queryStatus
            : "unread";

    const [status, setStatus] = useState<StatusFilter>(initialStatus);
    const [items, setItems] = useState<InboxItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const nextQueryStatus = searchParams.get("status");
        if (
            nextQueryStatus === "read" ||
            nextQueryStatus === "all" ||
            nextQueryStatus === "unread"
        ) {
            setStatus(nextQueryStatus);
        }
    }, [searchParams]);

    useEffect(() => {
        let ignore = false;

        async function loadMessages() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/admin/messages?status=${status}&page=1&limit=50`);
                const body = (await response.json()) as InboxResponse & { error?: string };

                if (!response.ok) {
                    throw new Error(body.error ?? "שגיאה בטעינת ההודעות");
                }

                if (!ignore) {
                    setItems(body.items ?? []);
                }
            } catch (err) {
                if (!ignore) {
                    const message = err instanceof Error ? err.message : "שגיאה בטעינת ההודעות";
                    setError(message);
                    setItems([]);
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        loadMessages();

        return () => {
            ignore = true;
        };
    }, [status]);

    function handleFilterChange(value: string) {
        const nextStatus: StatusFilter =
            value === "read" || value === "all" || value === "unread" ? value : "unread";
        setStatus(nextStatus);
        router.replace(`/admin/messages?status=${nextStatus}`);
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">הודעות ממשתמשים</h1>
                    <p className="text-sm text-muted-foreground">
                        ברירת המחדל היא הודעות שלא נקראו.
                    </p>
                </div>
                <div className="w-44">
                    <label className="mb-1 block text-xs text-muted-foreground">סטטוס</label>
                    <Select value={status} onValueChange={handleFilterChange} dir="rtl">
                        <SelectTrigger>
                            <SelectValue placeholder="בחר סינון" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unread">לא נקראו</SelectItem>
                            <SelectItem value="read">נקראו</SelectItem>
                            <SelectItem value="all">הכל</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            {isLoading ? <p className="text-sm text-muted-foreground">טוען הודעות...</p> : null}

            {error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {!isLoading && !error && items.length === 0 ? (
                <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
                    אין הודעות להצגה בסינון: {filterLabel(status)}.
                </div>
            ) : null}

            {!isLoading && !error && items.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-right">
                            <tr>
                                <th className="px-3 py-2 font-medium">שולח</th>
                                <th className="px-3 py-2 font-medium">אימייל</th>
                                <th className="px-3 py-2 font-medium">נושא</th>
                                <th className="px-3 py-2 font-medium">נשלח</th>
                                <th className="px-3 py-2 font-medium">סטטוס</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t hover:bg-muted/30">
                                    <td className="px-3 py-2">
                                        <Link
                                            href={`/admin/messages/${item.id}?from=${status}`}
                                            className="font-medium hover:underline"
                                        >
                                            {item.sender_name}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground">{item.sender_email}</td>
                                    <td className="px-3 py-2">{item.subject}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{formatDate(item.created_at)}</td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.status === "unread"
                                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                                }`}
                                        >
                                            {item.status === "unread" ? "לא נקראה" : "נקראה"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}
