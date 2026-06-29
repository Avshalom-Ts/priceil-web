export function MethodBadge({ method }: { method: "GET" | "POST" }) {
    return (
        <span
            className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-bold ${method === "GET"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "bg-green-500/10 text-green-600 dark:text-green-400"
                }`}
            dir="ltr"
        >
            {method}
        </span>
    );
}

export function FieldTable({
    rows,
}: {
    rows: { field: string; type: string; required?: boolean; description: string }[];
}) {
    const hasRequired = rows.some((r) => r.required !== undefined);
    return (
        <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
                <thead className="bg-muted/40">
                    <tr>
                        <th className="px-3 py-2 text-right font-medium">שדה</th>
                        <th className="px-3 py-2 text-right font-medium">סוג</th>
                        {hasRequired && <th className="px-3 py-2 text-right font-medium">נדרש</th>}
                        <th className="px-3 py-2 text-right font-medium">תיאור</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {rows.map((r) => (
                        <tr key={r.field}>
                            <td className="px-3 py-2 font-mono text-xs">{r.field}</td>
                            <td className="px-3 py-2 font-mono text-xs">{r.type}</td>
                            {hasRequired && (
                                <td className="px-3 py-2 text-xs">{r.required ? "כן" : "לא"}</td>
                            )}
                            <td className="px-3 py-2 text-xs text-muted-foreground">{r.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function ErrorTable({
    rows = [
        { status: "400", meaning: "פרמטר לא תקין", action: "ולידציה בצד לקוח לפני שליחה." },
        { status: "404", meaning: "שאילתה לא נמצאה", action: "הציגו fallback ברור למשתמש." },
        { status: "429", meaning: "חריגה ממגבלת קצב", action: "retry עם backoff אקספוננציאלי." },
        { status: "500", meaning: "שגיאת שרת", action: "נסו שוב מאוחר יותר." },
    ],
}: {
    rows?: { status: string; meaning: string; action: string }[];
} = {}) {
    return (
        <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
                <thead className="bg-muted/40">
                    <tr>
                        <th className="px-3 py-2 text-right font-medium">סטטוס</th>
                        <th className="px-3 py-2 text-right font-medium">משמעות</th>
                        <th className="px-3 py-2 text-right font-medium">פעולה מומלצת</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {rows.map((r) => (
                        <tr key={r.status}>
                            <td className="px-3 py-2 font-mono text-xs">{r.status}</td>
                            <td className="px-3 py-2 text-xs">{r.meaning}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{r.action}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
