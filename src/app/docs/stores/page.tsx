function Method({ method }: { method: "GET" | "POST" }) {
    return (
        <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs font-bold ${method === "GET"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-green-500/10 text-green-600 dark:text-green-400"
                }`}
        >
            {method}
        </span>
    );
}

function RouteSection({
    method,
    path,
    description,
    params,
    example,
    response,
    notes,
}: {
    method: "GET" | "POST";
    path: string;
    description: string;
    params?: { name: string; type: string; required?: boolean; description: string }[];
    example: string;
    response: string;
    notes?: string;
}) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
            <div className="flex flex-wrap items-center gap-2">
                <Method method={method} />
                <code className="font-mono text-sm font-medium">{path}</code>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>

            {params && params.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">פרמטרים</p>
                    <div className="overflow-hidden rounded-lg border border-border text-sm">
                        <table className="w-full">
                            <thead className="bg-muted/40">
                                <tr>
                                    <th className="px-3 py-2 text-right font-medium">שם</th>
                                    <th className="px-3 py-2 text-right font-medium">סוג</th>
                                    <th className="px-3 py-2 text-right font-medium">נדרש</th>
                                    <th className="px-3 py-2 text-right font-medium">תיאור</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {params.map((p) => (
                                    <tr key={p.name}>
                                        <td className="px-3 py-2 font-mono text-xs">{p.name}</td>
                                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.type}</td>
                                        <td className="px-3 py-2 text-xs">
                                            {p.required ? (
                                                <span className="text-destructive">כן</span>
                                            ) : (
                                                <span className="text-muted-foreground">לא</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground">{p.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">דוגמה</p>
                    <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-300 whitespace-pre overflow-x-auto">{example}</div>
                </div>
                <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">תשובה</p>
                    <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-300 whitespace-pre overflow-x-auto">{response}</div>
                </div>
            </div>

            {notes && (
                <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{notes}</p>
            )}
        </div>
    );
}

export default function StoresDocsPage() {
    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">חנויות</h1>
                <p className="mt-2 text-muted-foreground">
                    רשימת חנויות וסניפים, סינון לפי עיר ורשת, ומידע על כל הרשתות.
                </p>
            </div>

            <section className="flex flex-col gap-4">
                <RouteSection
                    method="GET"
                    path="/stores"
                    description="רשימת כל החנויות עם אפשרות סינון לפי עיר ו/או רשת."
                    params={[
                        { name: "city", type: "string", description: "סינון לפי שם עיר (partial match)" },
                        { name: "chain", type: "string", description: "סינון לפי שם רשת (partial match)" },
                        { name: "page", type: "number", description: "מספר עמוד (ברירת מחדל: 1)" },
                        { name: "limit", type: "number", description: "תוצאות לעמוד (ברירת מחדל: 20)" },
                    ]}
                    example={`GET /stores?city=תל אביב&chain=שופרסל`}
                    response={`{
  "items": [
    {
      "id": 12,
      "storeName": "שופרסל דיל",
      "city": "תל אביב",
      "address": "דיזנגוף 50",
      "chain": {
        "chainId": "7290027600007",
        "chainName": "שופרסל"
      }
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 20
}`}
                />

                <RouteSection
                    method="GET"
                    path="/stores/chains"
                    description="רשימת כל הרשתות עם מספר הסניפים לכל רשת."
                    example={`GET /stores/chains`}
                    response={`[
  {
    "chainId": "7290027600007",
    "chainName": "שופרסל",
    "storeCount": 280
  },
  {
    "chainId": "7290058140886",
    "chainName": "רמי לוי שיווק השקמה",
    "storeCount": 60
  }
]`}
                />

                <RouteSection
                    method="GET"
                    path="/stores/:id"
                    description="שליפת חנות בודדת לפי מזהה פנימי, כולל פרטי הרשת."
                    example={`GET /stores/42`}
                    response={`{
  "id": 42,
  "storeName": "רמי לוי",
  "city": "ירושלים",
  "address": "רחוב יפו 100",
  "chain": {
    "chainId": "7290058140886",
    "chainName": "רמי לוי שיווק השקמה"
  }
}`}
                    notes="מחזיר 404 אם המזהה לא קיים."
                />
            </section>
        </div>
    );
}
