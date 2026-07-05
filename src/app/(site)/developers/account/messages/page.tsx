"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MessageItem = {
    id: string;
    subject: string;
    content: string;
    status: "unread" | "read";
    created_at: string;
    updated_at: string;
    read_at: string | null;
    reply_content: string | null;
    replied_at: string | null;
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function MessagesPage() {
    const [items, setItems] = useState<MessageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        async function loadMessages() {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/account/messages?limit=100");
                const body = (await response.json()) as { items?: MessageItem[]; error?: string };

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
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadMessages();

        return () => {
            ignore = true;
        };
    }, []);

    return (
        <div className="container mx-auto max-w-4xl px-4 py-10 flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">ההודעות שלי</h1>
                    <p className="text-sm text-muted-foreground">
                        כאן אפשר לראות את כל הפניות שלך ולפתוח כל הודעה בנפרד.
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/developers/account">חזרה לחשבון</Link>
                </Button>
            </div>

            {loading ? <p className="text-sm text-muted-foreground">טוען הודעות...</p> : null}

            {error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {!loading && !error && items.length === 0 ? (
                <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
                    עדיין לא שלחתם הודעות למנהלי המערכת.
                </div>
            ) : null}

            {!loading && !error && items.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-right">
                            <tr>
                                <th className="px-4 py-3 font-medium">נושא</th>
                                <th className="px-4 py-3 font-medium">סטטוס</th>
                                <th className="px-4 py-3 font-medium">תשובה</th>
                                <th className="px-4 py-3 font-medium">נשלח</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/developers/account/messages/${item.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {item.subject}
                                        </Link>
                                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                            {item.content}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={item.status === "read" ? "secondary" : "outline"}>
                                            {item.status === "read" ? "נקראה" : "לא נקראה"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {item.reply_content ? "יש תשובה" : "אין תשובה עדיין"}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(item.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

            <section>
                <Button asChild variant="outline" size="sm">
                    <Link href="/contact">
                        שליחת הודעה חדשה למנהלי המערכת
                    </Link>
                </Button>
            </section>
        </div>
    );
}