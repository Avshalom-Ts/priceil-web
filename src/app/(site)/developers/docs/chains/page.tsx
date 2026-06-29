
import { CodeBlock } from "@/components/code-block";
import { ShellCommand } from "@/components/shell-command";
import { MethodBadge } from "@/components/docs/endpoint-ui";

export default function ChainsPage() {
    return (
        <div className="flex flex-col gap-10">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">נתיב רשתות המזון בארץ</h1>
                <p className="text-sm text-muted-foreground">
                    תיעוד ממוקד לנתיב שמחזיר את כל רשתות השיווק ומספר הסניפים בכל רשת.
                    זהו הנתיב המומלץ לבניית פילטר רשתות, תפריט בחירה וסטטיסטיקות כיסוי.
                </p>
            </header>

            <section className="flex flex-col gap-4 rounded-xl border border-border p-5">
                <div className="flex flex-wrap items-center gap-2 text-left" dir="ltr">
                    <MethodBadge method="GET" />
                    <code className="font-mono text-sm">/stores/chains</code>
                </div>
                <p className="text-sm text-muted-foreground">
                    מחזיר מערך של רשתות. לכל רשת מוחזרים מזהה רשת, שם רשת, ומספר הסניפים
                    המשויך לה (storeCount).
                </p>

                <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                    <p className="mb-1 font-semibold text-foreground">Query params</p>
                    לנתיב הזה אין פרמטרים, אין pagination, והוא מחזיר את כל הרשתות בבת אחת.
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">דוגמת בקשה</h2>
                <ShellCommand
                    tabs={[
                        { label: "Linux / macOS", command: `curl "https://api.priceil.dev/stores/chains"` },
                        { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/stores/chains" | ConvertTo-Json -Depth 5` },
                    ]}
                />
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">דוגמת תשובה (data)</h2>
                <CodeBlock>{`[
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
]`}</CodeBlock>
                <p className="text-xs text-muted-foreground">
                    בפועל, כמו בשאר המערכת, התשובה עטופה במעטפת success/data/timestamp
                    המתוארת בדף הסקירה הראשי.
                </p>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">השדות שבתשובה</h2>
                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-3 py-2 text-right font-medium">שדה</th>
                                <th className="px-3 py-2 text-right font-medium">סוג</th>
                                <th className="px-3 py-2 text-right font-medium">תיאור</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr>
                                <td className="px-3 py-2 font-mono text-xs">chainId</td>
                                <td className="px-3 py-2 font-mono text-xs">מחרוזת</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                    מזהה רשמי של הרשת.
                                </td>
                            </tr>
                            <tr>
                                <td className="px-3 py-2 font-mono text-xs">chainName</td>
                                <td className="px-3 py-2 font-mono text-xs">מחרוזת</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                    שם רשת קריא למשתמש להצגה ב-UI.
                                </td>
                            </tr>
                            <tr>
                                <td className="px-3 py-2 font-mono text-xs">storeCount</td>
                                <td className="px-3 py-2 font-mono text-xs">מספר</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                    מספר הסניפים המשויכים לרשת בזמן הבקשה.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>


            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">שגיאות נפוצות</h2>
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
                            <tr>
                                <td className="px-3 py-2 font-mono text-xs">429</td>
                                <td className="px-3 py-2 text-xs">חריגה ממגבלת קצב</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">retry עם backoff אקספוננציאלי.</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-2 font-mono text-xs">500</td>
                                <td className="px-3 py-2 text-xs">שגיאת שרת</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">הציגו fallback ידידותי ונסו שוב מאוחר יותר.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
    );
}