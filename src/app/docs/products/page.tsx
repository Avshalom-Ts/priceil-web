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

function EndpointCard({
  method,
  path,
  summary,
  params,
  curl,
  success,
  errors,
  notes,
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
  notes?: string;
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

      {notes && (
        <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {notes}
        </p>
      )}
    </article>
  );
}

export default function ProductsDocsPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">מוצרים</h1>
        <p className="text-sm text-muted-foreground">
          כל נקודות הקצה של מוצרים וקבוצות מוצרים. בחיפושי טקסט מרובי מילים,
          המערכת עובדת בלוגיקת AND (כל מילה חייבת להופיע בשם), כך שסדר מילים
          שונה אמור להחזיר תוצאות שקולות.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="border-b border-border pb-2 text-xl font-semibold">Products</h2>

        <EndpointCard
          method="GET"
          path="/products"
          summary="חיפוש/דפדוף מוצרים עם pagination. אם q כולל כמה מילים, כל המילים נדרשות בשם המוצר."
          params={[
            { name: "q", location: "query", type: "string", required: false, description: "חיפוש חופשי בשם מוצר" },
            { name: "page", location: "query", type: "number", required: false, description: "ברירת מחדל: 1" },
            { name: "limit", location: "query", type: "number", required: false, description: "ברירת מחדל: 20" },
          ]}
          curl={`curl "https://api.priceil.com/products?q=milk&page=1&limit=10"`}
          success={`{
  "items": [
    { "itemCode": "7290000051352", "itemName": "Milk 3% 1L" }
  ],
  "total": 342,
  "page": 1,
  "limit": 10
}`}
          errors={`400 Bad Request (invalid numeric query params)
429 Too Many Requests
500 Internal Server Error`}
        />

        <EndpointCard
          method="GET"
          path="/products/search"
          summary="חיפוש מוצרים בתוך חנות ספציפית, כולל מחיר המוצר בחנות שנבחרה."
          params={[
            { name: "q", location: "query", type: "string", required: false, description: "חיפוש בשם מוצר בתוך החנות" },
            { name: "storeId", location: "query", type: "number", required: true, description: "מזהה חנות פנימי" },
            { name: "page", location: "query", type: "number", required: false, description: "ברירת מחדל: 1" },
            { name: "limit", location: "query", type: "number", required: false, description: "ברירת מחדל: 20" },
          ]}
          curl={`curl "https://api.priceil.com/products/search?q=milk&storeId=12&page=1&limit=10"`}
          success={`{
  "items": [
    {
      "itemCode": "7290000051352",
      "itemName": "Milk 3% 1L",
      "price": "5.90",
      "priceUpdateDate": "2026-03-20T00:00:00.000Z",
      "storeId": 12,
      "storeName": "Rami Levy",
      "city": "Tel Aviv",
      "address": "Herzl 1",
      "chain": "Rami Levy"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}`}
          errors={`400 storeId is required and must be a number
404 Store <id> not found
429 Too Many Requests`}
        />

        <EndpointCard
          method="GET"
          path="/products/:barcode"
          summary="שליפת מוצר יחיד לפי ברקוד (itemCode), ללא מחירים."
          params={[
            { name: "barcode", location: "path", type: "string", required: true, description: "Barcode / itemCode" },
          ]}
          curl={`curl "https://api.priceil.com/products/7290000051352"`}
          success={`{
  "itemCode": "7290000051352",
  "itemName": "Milk 3% 1L"
}`}
          errors={`404 Product <barcode> not found
429 Too Many Requests`}
        />

        <EndpointCard
          method="GET"
          path="/products/:barcode/prices"
          summary="מחזיר מוצר + כל המחירים הקיימים שלו בסניפים, ממויין מהזול ליקר."
          params={[
            { name: "barcode", location: "path", type: "string", required: true, description: "Barcode / itemCode" },
          ]}
          curl={`curl "https://api.priceil.com/products/7290000051352/prices"`}
          success={`{
  "product": { "itemCode": "7290000051352", "itemName": "Milk 3% 1L" },
  "prices": [
    {
      "price": "5.90",
      "priceUpdateDate": "2026-03-20T00:00:00.000Z",
      "storeId": 12,
      "storeName": "Rami Levy",
      "city": "Tel Aviv",
      "address": "Herzl 1",
      "chain": "Rami Levy"
    }
  ]
}`}
          errors={`404 Product <barcode> not found
429 Too Many Requests`}
        />

        <EndpointCard
          method="GET"
          path="/products/:barcode/prices/:storeId"
          summary="מחיר מוצר יחיד בסניף ספציפי."
          params={[
            { name: "barcode", location: "path", type: "string", required: true, description: "Barcode / itemCode" },
            { name: "storeId", location: "path", type: "number", required: true, description: "Store internal id" },
          ]}
          curl={`curl "https://api.priceil.com/products/7290000051352/prices/12"`}
          success={`{
  "price": "5.90",
  "priceUpdateDate": "2026-03-20T00:00:00.000Z",
  "storeId": 12,
  "storeName": "Rami Levy",
  "city": "Tel Aviv",
  "address": "Herzl 1",
  "chain": "Rami Levy"
}`}
          errors={`404 Product <barcode> not found
404 Store <storeId> not found
404 Product <barcode> not found in store <storeId>
429 Too Many Requests`}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="border-b border-border pb-2 text-xl font-semibold">Product groups</h2>

        <EndpointCard
          method="GET"
          path="/products/groups"
          summary="חיפוש קבוצות מוצרים (מוצרים שקולים בין רשתות עם ברקודים שונים). מוחזרות רק קבוצות שיש להן לפחות מוצר אחד מקושר בפועל."
          params={[
            { name: "q", location: "query", type: "string", required: false, description: "חיפוש בשם הקבוצה" },
            { name: "page", location: "query", type: "number", required: false, description: "ברירת מחדל: 1" },
            { name: "limit", location: "query", type: "number", required: false, description: "ברירת מחדל: 20" },
          ]}
          curl={`curl "https://api.priceil.com/products/groups?q=milk&page=1&limit=20"`}
          success={`{
  "items": [{ "id": 42, "name": "Milk 3% 1L" }],
  "total": 1,
  "page": 1,
  "limit": 20
}`}
          errors={`400 Bad Request (invalid page/limit)
429 Too Many Requests`}
        />

        <EndpointCard
          method="GET"
          path="/products/groups/:id"
          summary="שליפת קבוצה יחידה כולל כל הברקודים/מוצרים המשויכים אליה."
          params={[
            { name: "id", location: "path", type: "number", required: true, description: "Group id" },
          ]}
          curl={`curl "https://api.priceil.com/products/groups/42"`}
          success={`{
  "id": 42,
  "name": "Milk 3% 1L",
  "products": [
    { "itemCode": "7290000051352", "itemName": "Milk 3% 1L" },
    { "itemCode": "7290000042015", "itemName": "Milk 3% 1L" }
  ]
}`}
          errors={`404 Product group <id> not found
429 Too Many Requests`}
        />

        <EndpointCard
          method="GET"
          path="/products/groups/:id/prices/:storeId"
          summary="מחזיר את המחיר הזול ביותר הזמין לקבוצה בחנות נתונה (לפי ברקודים של הקבוצה, ובנפילה לפי שם)."
          params={[
            { name: "id", location: "path", type: "number", required: true, description: "Group id" },
            { name: "storeId", location: "path", type: "number", required: true, description: "Store id" },
          ]}
          curl={`curl "https://api.priceil.com/products/groups/42/prices/12"`}
          success={`{
  "groupId": 42,
  "groupName": "Milk 3% 1L",
  "itemCode": "7290000042015",
  "itemName": "Milk 3% 1L",
  "price": "5.90",
  "priceUpdateDate": "2026-03-20T00:00:00.000Z",
  "storeId": 12,
  "storeName": "Rami Levy",
  "city": "Tel Aviv",
  "address": "Herzl 1",
  "chain": "Rami Levy"
}`}
          errors={`404 Product group <id> not found
404 Store <storeId> not found
404 Group "<groupName>" not available at store <storeId>
429 Too Many Requests`}
          notes="נקודת קצה קריטית לבניית סל קניות חכם לפי groupId במקום ברקוד קשיח."
        />
      </section>
    </div>
  );
}
