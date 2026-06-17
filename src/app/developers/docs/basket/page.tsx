function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-bold ${
        method === "GET"
          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "bg-green-500/10 text-green-600 dark:text-green-400"
      }`}
      dir="ltr"
    >
      {method}
    </span>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      dir="ltr"
      className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-left font-mono text-xs leading-5 text-zinc-300"
    >
      {children}
    </pre>
  );
}

export default function BasketDocsPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">סל קניות</h1>
        <p className="text-sm text-muted-foreground">
          נקודת קצה להשוואת עלות סל בין חנויות. אפשר לשלוח ברקודים קשיחים,
          groupIds, או שילוב של שניהם.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 text-left" dir="ltr">
          <MethodBadge method="POST" />
          <code className="font-mono text-sm">/basket/compare</code>
        </div>

        <p className="text-sm text-muted-foreground">
          המערכת מחשבת total לכל חנות על בסיס כל הפריטים שנשלחו. עבור groupIds,
          בכל חנות נלקח הברקוד הזול ביותר מהקבוצה הזמין באותה חנות.
        </p>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
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
                <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                  barcodes
                </td>
                <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                  string[]
                </td>
                <td className="px-3 py-2 text-xs">לא</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  ברקודים ספציפיים (itemCode)
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                  groupIds
                </td>
                <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                  number[]
                </td>
                <td className="px-3 py-2 text-xs">לא</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  מזהי קבוצות מוצרים
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          אם שני השדות ריקים — מוחזרת רשימה ריקה. אם נשלחים ברקודים/קבוצות שלא
          קיימים במערכת — מוחזרת שגיאת 404.
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Curl
            </p>
            <CodeBlock>{`curl -X POST "https://api.priceil.com/basket/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "barcodes": ["7290000123456"],
    "groupIds": [42, 55]
  }'`}</CodeBlock>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Success (data) — HTTP 201
            </p>
            <CodeBlock>{`[
  {
    "storeId": 12,
    "storeName": "Rami Levy",
    "chain": "Rami Levy",
    "city": "Tel Aviv",
    "address": "Herzl 1",
    "total": 84.2,
    "found": 3,
    "missing": []
  },
  {
    "storeId": 34,
    "storeName": "Shufersal Deal",
    "chain": "Shufersal",
    "city": "Ramat Gan",
    "address": "Bialik 7",
    "total": 90.1,
    "found": 2,
    "missing": ["group:55"]
  }
]`}</CodeBlock>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Common errors
            </p>
            <CodeBlock>{`404 Unknown barcodes: ...
404 Unknown group IDs: ...
429 Too Many Requests
500 Internal Server Error`}</CodeBlock>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-muted/20 p-5">
        <h2 className="mb-2 text-sm font-semibold">פירוש שדות תוצאה</h2>
        <ul className="list-disc space-y-1 pr-5 text-xs leading-relaxed text-muted-foreground">
          <li>
            <span className="font-mono" dir="ltr">
              total
            </span>{" "}
            — סכום סל לחנות (מעוגל ל-2 ספרות אחרי הנקודה).
          </li>
          <li>
            <span className="font-mono" dir="ltr">
              found
            </span>{" "}
            — כמה פריטים נמצאו בפועל בחנות.
          </li>
          <li>
            <span className="font-mono" dir="ltr">
              missing
            </span>{" "}
            — רשימת פריטים שלא נמצאו: ברקוד ישיר או מחרוזת
            <span className="font-mono" dir="ltr">
              {" "}group:&lt;id&gt;
            </span>
            .
          </li>
          <li>התוצאות ממיונות אוטומטית מהסל הזול ליקר.</li>
        </ul>
      </section>
    </div>
  );
}
