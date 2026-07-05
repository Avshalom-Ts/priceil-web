"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type MessageItem = {
    id: string;
    user_id: string;
    sender_name: string;
    sender_email: string;
    subject: string;
    content: string;
    status: "unread" | "read";
    created_at: string;
    updated_at: string;
    read_at: string | null;
    read_by: string | null;
    reply_content: string | null;
    replied_at: string | null;
    replied_by: string | null;
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

export default function AdminMessageDetailsPage() {
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const messageId = params.id;
    const from = searchParams.get("from") ?? "unread";

    const [item, setItem] = useState<MessageItem | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isSavingReply, setIsSavingReply] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        async function load() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/admin/messages/${messageId}`);
                const body = (await response.json()) as { item?: MessageItem; error?: string };

                if (!response.ok || !body.item) {
                    throw new Error(body.error ?? "ההודעה לא נמצאה");
                }

                let nextItem = body.item;

                if (nextItem.status === "unread") {
                    const markRead = await fetch(`/api/admin/messages/${messageId}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "read" }),
                    });

                    if (markRead.ok) {
                        nextItem = {
                            ...nextItem,
                            status: "read",
                            read_at: new Date().toISOString(),
                        };
                    }
                }

                if (!ignore) {
                    setItem(nextItem);
                    setReplyContent(nextItem.reply_content ?? "");
                }
            } catch (err) {
                if (!ignore) {
                    const message = err instanceof Error ? err.message : "שגיאה בטעינת ההודעה";
                    setError(message);
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        load();

        return () => {
            ignore = true;
        };
    }, [messageId]);

    async function toggleStatus() {
        if (!item) return;

        setIsUpdating(true);
        setError(null);
        const nextStatus = item.status === "read" ? "unread" : "read";

        try {
            const response = await fetch(`/api/admin/messages/${item.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const body = (await response.json()) as {
                item?: { status: "read" | "unread"; read_at: string | null; read_by: string | null };
                error?: string;
            };

            if (!response.ok || !body.item) {
                throw new Error(body.error ?? "עדכון סטטוס נכשל");
            }

            const updatedStatus = body.item;

            setItem((prev) =>
                prev
                    ? {
                        ...prev,
                        status: updatedStatus.status,
                        read_at: updatedStatus.read_at,
                        read_by: updatedStatus.read_by,
                    }
                    : prev,
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : "עדכון סטטוס נכשל";
            setError(message);
        } finally {
            setIsUpdating(false);
        }
    }

    async function saveReply() {
        if (!item) return;

        setIsSavingReply(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/messages/${item.id}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ replyContent }),
            });
            const body = (await response.json()) as {
                item?: {
                    reply_content: string | null;
                    replied_at: string | null;
                    replied_by: string | null;
                    status: "read" | "unread";
                    read_at: string | null;
                    read_by: string | null;
                };
                error?: string;
            };

            if (!response.ok || !body.item) {
                throw new Error(body.error ?? "שמירת התשובה נכשלה");
            }

            const updatedItem = body.item;

            setItem((prev) =>
                prev
                    ? {
                        ...prev,
                        reply_content: updatedItem.reply_content,
                        replied_at: updatedItem.replied_at,
                        replied_by: updatedItem.replied_by,
                        status: updatedItem.status,
                        read_at: updatedItem.read_at,
                        read_by: updatedItem.read_by,
                    }
                    : prev,
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : "שמירת התשובה נכשלה";
            setError(message);
        } finally {
            setIsSavingReply(false);
        }
    }

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">טוען הודעה...</p>;
    }

    if (error || !item) {
        return (
            <div className="flex flex-col gap-4">
                <Link href={`/admin/messages?status=${from}`} className="text-sm text-muted-foreground hover:underline">
                    חזרה לרשימת ההודעות
                </Link>
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error ?? "ההודעה לא נמצאה"}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/messages?status=${from}`}>
                        חזרה לרשימת ההודעות
                    </Link>
                </Button>
                <Button variant="outline" onClick={toggleStatus} disabled={isUpdating}>
                    {isUpdating
                        ? "מעדכן..."
                        : item.status === "read"
                            ? "סמן כלא נקראה"
                            : "סמן כנקראה"}
                </Button>
            </div>

            <header className="rounded-lg border p-4">
                <h1 className="text-xl font-bold mb-2">{item.subject}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm text-muted-foreground">
                    <p>
                        <span className="font-medium text-foreground">מאת:</span> {item.sender_name}
                    </p>
                    <p>
                        <span className="font-medium text-foreground">אימייל:</span> {item.sender_email}
                    </p>
                    <p>
                        <span className="font-medium text-foreground">נשלח:</span> {formatDate(item.created_at)}
                    </p>
                    <p>
                        <span className="font-medium text-foreground">סטטוס:</span>{" "}
                        {item.status === "read" ? "נקראה" : "לא נקראה"}
                    </p>
                    <p>
                        <span className="font-medium text-foreground">נקראה ב:</span> {formatDate(item.read_at)}
                    </p>
                </div>
            </header>

            {error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            <section className="bg-muted/20 p-4">
                <h2 className="mb-3 text-base font-semibold">תוכן ההודעה</h2>
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{item.content}</p>
            </section>

            <section className="rounded-lg border p-4 flex flex-col gap-3">
                <div>
                    <h2 className="text-base font-semibold">תשובת המנהלים</h2>
                </div>

                <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={5}
                    placeholder="כתוב כאן תשובה למשתמש..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {item.reply_content ? (
                    <p className="text-xs text-muted-foreground">
                        תשובה נשלחה ב ־{" "}{formatDate(item.replied_at)}
                    </p>
                ) : null}

                <div className="flex items-center gap-2 flex-wrap">
                    <Button onClick={saveReply} disabled={isSavingReply || !replyContent.trim()}>
                        {isSavingReply ? "שומר..." : "שמור תשובה"}
                    </Button>
                </div>
            </section>
        </div>
    );
}