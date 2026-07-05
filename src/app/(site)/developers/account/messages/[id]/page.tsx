"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

function formatDate(iso: string | null): string {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AccountMessageDetailsPage() {
    const params = useParams<{ id: string }>();
    const messageId = Array.isArray(params.id) ? params.id[0] : params.id;
    const [item, setItem] = useState<MessageItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        if (!messageId) {
            setError("ההודעה לא נמצאה");
            setLoading(false);
            return () => {
                ignore = true;
            };
        }

        async function loadMessage() {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/account/messages/${messageId}`);
                const body = (await response.json()) as { item?: MessageItem; error?: string };

                if (!response.ok || !body.item) {
                    throw new Error(body.error ?? "ההודעה לא נמצאה");
                }

                if (!ignore) {
                    setItem(body.item);
                }
            } catch (err) {
                if (!ignore) {
                    const message = err instanceof Error ? err.message : "שגיאה בטעינת ההודעה";
                    setError(message);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadMessage();

        return () => {
            ignore = true;
        };
    }, [messageId]);

    return (
        <div className="container mx-auto max-w-3xl px-4 py-10 flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">פרטי ההודעה</h1>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/developers/account/messages">חזרה לרשימת ההודעות</Link>
                </Button>
            </div>

            {loading ? <p className="text-sm text-muted-foreground">טוען הודעה...</p> : null}

            {error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {!loading && !error && !item ? (
                <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
                    ההודעה לא נמצאה.
                </div>
            ) : null}

            {!loading && !error && item ? (
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex flex-col sm:flex-row items-baseline gap-4">
                            <h2 className="text-xl font-semibold">{item.subject}</h2>
                            <p className="text-xs text-muted-foreground">נשלח ב־{formatDate(item.created_at)}</p>
                        </div>
                        <Badge variant={item.status === "read" ? "secondary" : "outline"}>
                            {item.status === "read" ? "נקראה" : "לא נקראה"}
                        </Badge>
                    </div>

                    <section className="bg-muted/20 p-4">
                        <h3 className="mb-2 text-sm font-semibold">תוכן ההודעה</h3>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.content}</p>
                    </section>

                    <section className="bg-muted/20 p-4">
                        {item.reply_content ? (
                            <>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.reply_content}</p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    נענתה ב־{formatDate(item.replied_at)}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">עדיין לא התקבלה תשובה.</p>
                        )}
                    </section>
                </div>
            ) : null}
        </div>
    );
}
