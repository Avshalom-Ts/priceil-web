import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="flex flex-col gap-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">תיעוד ה-API</h1>
                <p className="mt-2 text-muted-foreground">
                    REST API פתוח לנתוני מחירי סופרמרקט בישראל. ללא הרשמה בטיר החינמי.
                </p>
            </div>

            {/* Response envelope */}
            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">מבנה תשובה</h2>
                <p className="text-sm text-muted-foreground">
                    כל תשובה — הצלחה או שגיאה — עטופה במעטפת אחידה:
                </p>
                <div className="rounded-xl border border-border bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-300">
                    <pre>{`// הצלחה
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-18T12:00:00.000Z"
}

// שגיאה
{
  "success": false,
  "statusCode": 404,
  "message": "Product 123 not found",
  "timestamp": "2026-03-18T12:00:00.000Z"
}`}</pre>
                </div>
            </section>

            {/* Rate limiting */}
            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">הגבלת קצב</h2>
                <p className="text-sm text-muted-foreground">
                    כל הנקודות מוגבלות לפי טייר:
                </p>
                <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-2.5 text-right font-semibold">טייר</th>
                                <th className="px-4 py-2.5 text-right font-semibold">Header</th>
                                <th className="px-4 py-2.5 text-right font-semibold">מגבלה</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr>
                                <td className="px-4 py-2.5">חינמי</td>
                                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">ללא</td>
                                <td className="px-4 py-2.5">20 בקשות / 60 שניות</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2.5">בתשלום</td>
                                <td className="px-4 py-2.5 font-mono text-xs">x-api-key: &lt;key&gt;</td>
                                <td className="px-4 py-2.5">500 בקשות / 60 שניות</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="rounded-xl border border-border bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-300">
                    <pre>{`GET /products?q=חלב
x-api-key: your-secret-key`}</pre>
                </div>
            </section>

            {/* Route sections */}
            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">נקודות קצה</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        {
                            href: "/docs/products",
                            title: "מוצרים",
                            desc: "חיפוש מוצרים, מחירים לפי ברקוד, קבוצות מוצרים",
                            routes: ["GET /products", "GET /products/:barcode/prices", "GET /products/groups"],
                        },
                        {
                            href: "/docs/stores",
                            title: "חנויות",
                            desc: "רשימת חנויות, סינון לפי עיר/רשת, מידע על רשתות",
                            routes: ["GET /stores", "GET /stores/chains", "GET /stores/:id"],
                        },
                        {
                            href: "/docs/basket",
                            title: "סל קניות",
                            desc: "השוואת מחיר סל קניות מלא בין כל הסניפים",
                            routes: ["POST /basket/compare"],
                        },
                    ].map(({ href, title, desc, routes }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/30"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{title}</h3>
                                <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
                            <ul className="flex flex-col gap-1">
                                {routes.map((r) => (
                                    <li key={r} className="font-mono text-[11px] text-muted-foreground">
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
