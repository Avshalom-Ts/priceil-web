import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      dir="ltr"
      className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-left font-mono text-xs leading-6 text-zinc-300"
    >
      {children}
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">תיעוד ה-API</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          תיעוד מלא ל-PriceIL API עם דוגמאות מעשיות, שדות קלט/פלט, שגיאות נפוצות
          והנחיות עבודה. הטקסט התיאורי בעברית, והדוגמאות הטכניות מוצגות בפורמט
          LTR לקריאות טובה יותר.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Base URL וסביבות</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <p className="mb-2 text-sm font-semibold">Production</p>
            <CodeBlock>{`https://api.priceil.com`}</CodeBlock>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="mb-2 text-sm font-semibold">Development (LXC)</p>
            <CodeBlock>{`http://177.178.179.14:3000`}</CodeBlock>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">מעטפת תגובה אחידה</h2>
        <p className="text-sm text-muted-foreground">
          כל נקודות הקצה מוחזרות במעטפת סטנדרטית.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Success response
            </p>
            <CodeBlock>{`{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-25T07:10:00.000Z"
}`}</CodeBlock>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Error response
            </p>
            <CodeBlock>{`{
  "success": false,
  "statusCode": 404,
  "message": "Store 999 not found",
  "timestamp": "2026-03-25T07:10:00.000Z"
}`}</CodeBlock>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Rate limiting</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-right font-semibold">Tier</th>
                <th className="px-4 py-2.5 text-right font-semibold">Header</th>
                <th className="px-4 py-2.5 text-right font-semibold">Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-2.5">Free</td>
                <td className="px-4 py-2.5 font-mono text-xs" dir="ltr">
                  (none)
                </td>
                <td className="px-4 py-2.5">20 requests / 60s</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">Paid</td>
                <td className="px-4 py-2.5 font-mono text-xs" dir="ltr">
                  x-api-key: &lt;key&gt;
                </td>
                <td className="px-4 py-2.5">500 requests / 60s</td>
              </tr>
            </tbody>
          </table>
        </div>
        <CodeBlock>{`curl -H "x-api-key: your-paid-key" \
  "https://api.priceil.com/products?q=milk&page=1&limit=10"`}</CodeBlock>
        <p className="text-xs text-muted-foreground">
          במעבר מגבול הקצב יוחזר סטטוס 429. מומלץ ליישם retry עם backoff.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">קטגוריות נקודות קצה</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              href: "/developers/docs/products",
              title: "מוצרים",
              desc: "חיפוש מוצרים, מחירים לפי ברקוד, חיפוש בחנות וקבוצות מוצרים.",
              count: "8 routes",
            },
            {
              href: "/developers/docs/stores",
              title: "חנויות",
              desc: "רשימת חנויות, סינונים, שרשראות חנויות, וחנות בודדת.",
              count: "3 routes",
            },
            {
              href: "/developers/docs/basket",
              title: "סל קניות",
              desc: "השוואת סל לפי ברקודים ו/או groupIds בכל החנויות.",
              count: "1 route",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{item.title}</h3>
                <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                {item.count}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
