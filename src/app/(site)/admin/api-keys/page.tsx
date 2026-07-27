"use client";

import { FormEvent, useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { Check, Copy } from "lucide-react";

type CreateResponse = {
    target: {
        userId: string;
        email: string | null;
    };
    appId: string;
    appName: string;
    plan: {
        plan: string;
        monthly_limit: number;
    };
    quantity: number;
    key: string;
};

type GeneratedKeyItem = {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    lastUsedAt: string | null;
    userId: string;
    userEmail: string | null;
    appId: string;
    appName: string | null;
};

type KeysListResponse = {
    items: GeneratedKeyItem[];
    error?: string;
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

const DIALOG_OVERLAY =
    "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";

const DIALOG_CONTENT =
    "fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-background p-6 shadow-lg flex flex-col gap-5 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]";

export default function AdminUnlimitedKeysPage() {
    const [targetEmail, setTargetEmail] = useState("");
    const [appName, setAppName] = useState("");
    const [appDescription, setAppDescription] = useState("");
    const [keyNamePrefix, setKeyNamePrefix] = useState("unlimited");
    const [loading, setLoading] = useState(false);
    const [isListLoading, setIsListLoading] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CreateResponse | null>(null);
    const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeyItem[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    async function loadGeneratedKeys() {
        setIsListLoading(true);
        try {
            const response = await fetch("/api/admin/api-keys");
            const payload = (await response.json()) as KeysListResponse;
            console.log("🚀 ~ loadGeneratedKeys ~ payload:", payload)

            if (!response.ok) {
                setError(payload.error ?? "Failed to load generated keys");
                setGeneratedKeys([]);
                return;
            }

            setGeneratedKeys(payload.items ?? []);
        } catch {
            setError("Failed to load generated keys");
            setGeneratedKeys([]);
        } finally {
            setIsListLoading(false);
        }
    }

    async function deleteKey(keyId: string) {
        setIsDeletingId(keyId);
        setError(null);

        try {
            const response = await fetch(`/api/admin/api-keys/${keyId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const payload = (await response.json()) as { error?: string };
                setError(payload.error ?? "Failed to delete key");
                return;
            }

            setGeneratedKeys((current) => current.filter((item) => item.id !== keyId));
            setConfirmDeleteId((current) => (current === keyId ? null : current));
        } catch {
            setError("Failed to delete key");
        } finally {
            setIsDeletingId(null);
        }
    }

    function copyToClipboard(text: string, id: string) {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
        }).catch(() => {
            setError("Failed to copy key");
        });
    }

    useEffect(() => {
        void loadGeneratedKeys();
    }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);
        setCopiedId(null);

        try {
            const response = await fetch("/api/admin/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetEmail,
                    appName,
                    appDescription,
                    keyNamePrefix,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                setError(payload.error ?? "Failed to generate keys");
                return;
            }

            setResult(payload as CreateResponse);
            setTargetEmail("");
            setAppName("");
            setAppDescription("");
            setKeyNamePrefix("unlimited");
            await loadGeneratedKeys();
        } catch {
            setError("Failed to generate keys");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">מפתחות API</h1>
                <p className="text-sm text-muted-foreground">
                    יצירת מפתח API עבור אפליקציה חדשה. פעולה זו משדרגת את משתמש היעד לחבילת הפרימיום ללא הגבלה בבקשות (monthly_limit = -1).
                </p>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-5 items-end gap-4 rounded-lg border p-4">
                <label className="flex flex-col gap-1 text-sm">
                    אימייל
                    <input
                        className="rounded-md border bg-background px-3 py-2"
                        value={targetEmail}
                        onChange={(event) => setTargetEmail(event.target.value)}
                        type="email"
                        required
                        placeholder="owner@example.com"
                    />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    שם האפליקציה
                    <input
                        className="rounded-md border bg-background px-3 py-2"
                        value={appName}
                        onChange={(event) => setAppName(event.target.value)}
                        required
                        placeholder="שם האפליקציה"
                    />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    תיאור האפליקציה (אופציונלי)
                    <input
                        className="rounded-md border bg-background px-3 py-2"
                        value={appDescription}
                        onChange={(event) => setAppDescription(event.target.value)}
                        placeholder="תיאור האפליקציה"
                    />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    סוג חבילה
                    <input
                        className="rounded-md border bg-background px-3 py-2"
                        value={keyNamePrefix}
                        onChange={(event) => setKeyNamePrefix(event.target.value)}
                        placeholder="unlimited"
                        disabled
                    />
                </label>

                <button
                    className="inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Generating..." : "Generate API Key"}
                </button>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </form>

            <section className="grid gap-3 rounded-lg border p-4">
                <h2 className="text-lg font-semibold">All Generated Keys</h2>
                <p className="text-sm text-muted-foreground">
                    Includes system-generated keys only (unlimited-*).
                </p>

                {isListLoading ? <p className="text-sm text-muted-foreground">Loading keys...</p> : null}

                {!isListLoading ? (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-right">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Name</th>
                                    <th className="px-3 py-2 font-medium">Description</th>
                                    <th className="px-3 py-2 font-medium">User</th>
                                    <th className="px-3 py-2 font-medium">App</th>
                                    <th className="px-3 py-2 font-medium">Created</th>
                                    <th className="px-3 py-2 font-medium">Last used</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                    <th className="px-3 py-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {generatedKeys.map((keyItem) => (
                                    <tr key={keyItem.id} className="border-t align-top">
                                        <td className="px-3 py-2 font-mono text-xs">{keyItem.name}</td>
                                        <td className="px-3 py-2 font-mono text-xs">{keyItem.description}</td>
                                        <td className="px-3 py-2">{keyItem.userEmail ?? keyItem.userId}</td>
                                        <td className="px-3 py-2">{keyItem.appName ?? keyItem.appId}</td>
                                        <td className="px-3 py-2 text-muted-foreground">{formatDate(keyItem.createdAt)}</td>
                                        <td className="px-3 py-2 text-muted-foreground">{formatDate(keyItem.lastUsedAt)}</td>
                                        <td className="px-3 py-2">{keyItem.isActive ? "active" : "inactive"}</td>
                                        <td className="px-3 py-2">
                                            {confirmDeleteId === keyItem.id ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-destructive font-medium">Confirm?</span>
                                                    <button
                                                        type="button"
                                                        className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive disabled:opacity-50 cursor-pointer"
                                                        onClick={() => void deleteKey(keyItem.id)}
                                                        disabled={isDeletingId === keyItem.id}
                                                    >
                                                        {isDeletingId === keyItem.id ? "Deleting..." : "Delete"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        disabled={isDeletingId === keyItem.id}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive disabled:opacity-50"
                                                    onClick={() => setConfirmDeleteId(keyItem.id)}
                                                    disabled={isDeletingId !== null}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {generatedKeys.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                                            No generated keys found.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </section>

            <Dialog.Root
                open={result !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setResult(null);
                        setCopiedId(null);
                    }
                }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className={DIALOG_OVERLAY} />
                    <Dialog.Content className={DIALOG_CONTENT}>
                        {result ? (
                            <>
                                <div className="flex flex-col gap-1">
                                    <Dialog.Title className="text-lg font-bold">
                                        המפתח נוצר בהצלחה
                                    </Dialog.Title>
                                    <Dialog.Description className="text-sm text-muted-foreground">
                                        העתק את המפתח עכשיו - הוא לא יוצג שוב.
                                    </Dialog.Description>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    יעד: {result.target.email} | אפליקציה: {result.appName}
                                </p>

                                <div className="rounded-lg border bg-muted/50 p-3 flex items-center gap-3">
                                    <code className="flex-1 text-xs font-mono break-all leading-relaxed">
                                        {result.key}
                                    </code>
                                    <button
                                        type="button"
                                        className="inline-flex size-8 items-center justify-center rounded-md border bg-background cursor-pointer"
                                        onClick={() => copyToClipboard(result.key, "new-raw")}
                                        aria-label="Copy generated key"
                                    >
                                        {copiedId === "new-raw" ? (
                                            <Check className="size-3.5 text-green-500" />
                                        ) : (
                                            <Copy className="size-3.5" />
                                        )}
                                    </button>
                                </div>

                                <div className="flex justify-end">
                                    <Dialog.Close asChild>
                                        <button type="button" className="inline-flex rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground cursor-pointer">
                                            סגור
                                        </button>
                                    </Dialog.Close>
                                </div>
                            </>
                        ) : null}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
