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

export default function BasketDocsPage() {
    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">סל קניות</h1>
                <p className="mt-2 text-muted-foreground">
                    השוואת עלות סל קניות מלא בין כל הסניפים — ממוין מהזול ליקר.
                </p>
            </div>

            <section className="flex flex-col gap-4">
                {/* Route header */}
                <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Method method="POST" />
                        <code className="font-mono text-sm font-medium">/basket/compare</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        מחשב את עלות הסל בכל חנות שנמצאת במערכת. ניתן לשלוח ברקודים ספציפיים, מזהי קבוצות מוצרים, או שניהם יחד. התוצאות ממוינות לפי מחיר כולל עולה (הזול קודם).
                    </p>

                    {/* Request body */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            גוף הבקשה
                        </p>
                        <div className="overflow-hidden rounded-lg border border-border text-sm">
                            <table className="w-full">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-3 py-2 text-right font-medium">שדה</th>
                                        <th className="px-3 py-2 text-right font-medium">סוג</th>
                                        <th className="px-3 py-2 text-right font-medium">נדרש</th>
                                        <th className="px-3 py-2 text-right font-medium">תיאור</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <tr>
                                        <td className="px-3 py-2 font-mono text-xs">barcodes</td>
                                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">string[]</td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground">לא</td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground">רשימת ברקודים (item_code)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-2 font-mono text-xs">groupIds</td>
                                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">number[]</td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground">לא</td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground">רשימת מזהי קבוצות מוצרים</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            לפחות אחד מהשדות חייב להיות מסופק. ניתן לשלוח את שניהם.
                        </p>
                    </div>

                    {/* Example + response */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">דוגמה</p>
                            <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-300 whitespace-pre overflow-x-auto">{`POST /basket/compare
Content-Type: application/json

{
  "barcodes": ["7290000123456"],
  "groupIds": [42, 55]
}`}</div>
                        </div>
                        <div>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">תשובה</p>
                            <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-300 whitespace-pre overflow-x-auto">{`[
  {
    "storeId": 12,
    "storeName": "רמי לוי",
    "chain": "רמי לוי שיווק השקמה",
    "city": "תל אביב",
    "address": "רחוב הרצל 1",
    "total": 84.20,
    "found": 3,
    "missing": []
  },
  {
    "storeId": 34,
    "storeName": "שופרסל דיל",
    "chain": "שופרסל",
    "city": "רמת גן",
    "total": 90.10,
    "found": 2,
    "missing": ["group:55"]
  }
]`}</div>
                        </div>
                    </div>

                    {/* Missing items note */}
                    <div className="rounded-lg bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                        <p className="mb-1 font-semibold text-foreground">שדה missing</p>
                        <p>
                            פריטים חסרים מוצגים כברקוד ישיר (<code className="font-mono">&quot;7290009876543&quot;</code>) או כ-<code className="font-mono">&quot;group:&lt;id&gt;&quot;</code> לפריטי קבוצה שהחנות לא מוכרת.
                            מחזיר <span className="font-semibold text-destructive">404</span> אם ברקוד או מזהה קבוצה לא קיימים במערכת.
                        </p>
                    </div>
                </div>

                {/* Use case tip */}
                <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <p className="mb-2 text-sm font-semibold">טיפ — שימוש עם קבוצות מוצרים</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        כשבונים רשימת קניות, עדיף לשמור <code className="font-mono text-xs">groupId</code> במקום ברקוד ספציפי. כך ה-API ימצא את הברקוד שהחנות מוכרת — ברשתות שונות אותו מוצר יכול להופיע תחת ברקוד שונה, וקבוצה מאחדת אותם.
                    </p>
                    <div className="mt-3 rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-300 whitespace-pre overflow-x-auto">{`# קבוצות > /products/groups?q=שם מוצר → קבל groupId
# שמור את ה-groupId בסל
# שלח ל-/basket/compare עם groupIds: [...]`}</div>
                </div>
            </section>
        </div>
    );
}
