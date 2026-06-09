function MethodBadge({ method }: { method: "GET" | "POST" }) {
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

function EndpointCard({
  method,
  path,
  summary,
  params,
  curl,
  success,
  errors,
}: {
  method: "GET" | "POST";
  path: string;
  summary: string;
  params?: Array<{
    name: string;
    location: "query" | "path";
    type: string;
    required: boolean;
    description: string;
  }>;
  curl: string;
  success: string;
  errors: string;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-center gap-2 text-left" dir="ltr">
        <MethodBadge method={method} />
        <code className="font-mono text-sm">{path}</code>
      </div>

      <p className="text-sm text-muted-foreground">{summary}</p>

      {params && params.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-right font-medium">שם</th>
                <th className="px-3 py-2 text-right font-medium">מיקום</th>
                <th className="px-3 py-2 text-right font-medium">סוג</th>
                <th className="px-3 py-2 text-right font-medium">נדרש</th>
                <th className="px-3 py-2 text-right font-medium">תיאור</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {params.map((p) => (
                <tr key={`${path}-${p.name}`}>
                  <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                    {p.name}
                  </td>
                  <td className="px-3 py-2 text-xs" dir="ltr">
                    {p.location}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                    {p.type}
                  </td>
                  <td className="px-3 py-2 text-xs">{p.required ? "כן" : "לא"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Curl
          </p>
          <CodeBlock>{curl}</CodeBlock>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Success (data)
          </p>
          <CodeBlock>{success}</CodeBlock>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Common errors
          </p>
          <CodeBlock>{errors}</CodeBlock>
        </div>
      </div>
    </article>
  );
}

export default function StoresDocsPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">חנויות</h1>
        <p className="text-sm text-muted-foreground">
          נקודות קצה למידע על סניפים ורשתות. אפשר לסנן לפי עיר ורשת, או לשלוף
          חנות בודדת.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <EndpointCard
          method="GET"
          path="/stores"
          summary="רשימת חנויות עם pagination וסינון אופציונלי לפי city או chain."
          params={[
            { name: "city", location: "query", type: "string", required: false, description: "מסנן לפי city או storeName (ILIKE)" },
            { name: "chain", location: "query", type: "string", required: false, description: "מסנן לפי chainName (ILIKE)" },
            { name: "page", location: "query", type: "number", required: false, description: "ברירת מחדל: 1" },
            { name: "limit", location: "query", type: "number", required: false, description: "ברירת מחדל: 20" },
          ]}
          curl={`curl "https://api.priceil.com/stores?city=tel%20aviv&chain=shufersal&page=1&limit=20"`}
          success={`{
  "items": [
    {
      "id": 12,
      "chainId": "7290027600007",
      "subchainId": "1",
      "storeId": "5",
      "subchainName": "Shufersal",
      "storeName": "Shufersal Deal",
      "storeType": 1,
      "address": "Dizengoff 50",
      "city": "Tel Aviv",
      "zipcode": "6100000",
      "bikoretNo": 100,
      "lastUpdateDate": "2026-03-20",
      "latitude": "32.0853000",
      "longitude": "34.7817600",
      "chain": {
        "chainId": "7290027600007",
        "chainName": "Shufersal"
      }
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 20
}`}
          errors={`400 Bad Request (invalid page/limit)
429 Too Many Requests
500 Internal Server Error`}
        />

        <EndpointCard
          method="GET"
          path="/stores/chains"
          summary="רשימת כל הרשתות עם מספר הסניפים לכל רשת (storeCount)."
          curl={`curl "https://api.priceil.com/stores/chains"`}
          success={`[
  {
    "chainId": "7290027600007",
    "chainName": "Shufersal",
    "storeCount": 280
  },
  {
    "chainId": "7290058140886",
    "chainName": "Rami Levy",
    "storeCount": 60
  }
]`}
          errors={`429 Too Many Requests
500 Internal Server Error`}
        />

        <EndpointCard
          method="GET"
          path="/stores/:id"
          summary="שליפת חנות יחידה לפי מזהה פנימי, כולל פרטי רשת."
          params={[
            { name: "id", location: "path", type: "number", required: true, description: "Store internal id" },
          ]}
          curl={`curl "https://api.priceil.com/stores/12"`}
          success={`{
  "id": 12,
  "chainId": "7290027600007",
  "subchainId": "1",
  "storeId": "5",
  "subchainName": "Shufersal",
  "storeName": "Shufersal Deal",
  "storeType": 1,
  "address": "Dizengoff 50",
  "city": "Tel Aviv",
  "zipcode": "6100000",
  "bikoretNo": 100,
  "lastUpdateDate": "2026-03-20",
  "latitude": "32.0853000",
  "longitude": "34.7817600",
  "chain": {
    "chainId": "7290027600007",
    "chainName": "Shufersal"
  }
}`}
          errors={`404 Store <id> not found
429 Too Many Requests`}
        />
      </section>

      <section className="rounded-xl border border-border bg-muted/20 p-5">
        <h2 className="mb-2 text-sm font-semibold">הערות שימוש</h2>
        <ul className="list-disc space-y-1 pr-5 text-xs leading-relaxed text-muted-foreground">
          <li>מיון שרת ברירת מחדל: לפי chainName ואז city.</li>
          <li>
            פרמטר city מסנן גם לפי שם סניף (storeName), לא רק לפי שם עיר.
          </li>
          <li>
            כל התגובות בפועל עטופות במעטפת success/data/timestamp כפי שמפורט בדף
            הסקירה הראשי.
          </li>
        </ul>
      </section>
    </div>
  );
}
