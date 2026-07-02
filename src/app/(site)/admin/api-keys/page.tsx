"use client";

import { FormEvent, useMemo, useState } from "react";

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

export default function AdminUnlimitedKeysPage() {
    const [targetEmail, setTargetEmail] = useState("");
    const [appName, setAppName] = useState("");
    const [appDescription, setAppDescription] = useState("");
    const [keyNamePrefix, setKeyNamePrefix] = useState("unlimited");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CreateResponse | null>(null);

    const keysText = useMemo(() => {
        if (!result) return "";
        return result.key;
    }, [result]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

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
                    יצירת מפתח API בודד עבור אפליקציה חדשה. פעולה זו משדרגת את המשתמש היעד לפרימיום עם monthly_limit = -1.
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

            {result ? (
                <section className="grid gap-3 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">Generated Keys</h2>
                    <p className="text-sm text-muted-foreground">
                        Target: {result.target.email} | App: {result.appName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Applied plan: {result.plan.plan} (monthly_limit: {result.plan.monthly_limit})
                    </p>
                    <textarea
                        readOnly
                        value={keysText}
                        className="min-h-56 w-full rounded-md border bg-background p-3 font-mono text-xs"
                    />
                </section>
            ) : null}
        </div>
    );
}
