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
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        פרמטרים
                    </p>
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

export default function ProductsDocsPage() {
    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">מוצרים</h1>
                <p className="mt-2 text-muted-foreground">
                    חיפוש מוצרים, מחירים לפי ברקוד, וקבוצות מוצרים.
                </p>
            </div>

            {/* Products */}
            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold border-b border-border pb-2">מוצרים</h2>

                <RouteSection
                    method="GET"
                    path="/products"
                    description="חיפוש וגלישה בכל המוצרים. תומך בחיפוש חופשי לפי שם עם pagination."
                    params={[
                        { name: "q", type: "string", description: "חיפוש חופשי בשם המוצר (case-insensitive, partial match)" },
                        { name: "page", type: "number", description: "מספר עמוד (ברירת מחדל: 1)" },
                        { name: "limit", type: "number", description: "תוצאות לעמוד (ברירת מחדל: 20)" },
                    ]}
                    example={`GET /products?q=חלב&page=1&limit=10`}
                    response={`{
  "items": [
    {
      "itemCode": "7290000051352",
      "itemName": "חלב תנובה 3% 1L"
    }
  ],
  "total": 342,
  "page": 1,
  "limit": 10
}`}
                />

                <RouteSection
                    method="GET"
                    path="/products/search"
                    description="חיפוש מוצרים לפי שם בתוך חנות ספציפית — מחזיר גם את המחיר בחנות."
                    params={[
                        { name: "q", type: "string", description: "חיפוש חופשי בשם המוצר (כל המילים חייבות להופיע)" },
                        { name: "storeId", type: "number", required: true, description: "מזהה החנות הפנימי" },
                        { name: "page", type: "number", description: "מספר עמוד (ברירת מחדל: 1)" },
                        { name: "limit", type: "number", description: "תוצאות לעמוד (ברירת מחדל: 20)" },
                    ]}
                    example={`GET /products/search?q=חלב&storeId=12`}
                    response={`{
  "items": [
    {
      "itemCode": "7290000051352",
      "itemName": "חלב תנובה 3% 1L",
      "price": "5.90",
      "storeName": "רמי לוי",
      "city": "תל אביב"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}`}
                    notes="מחזיר 400 אם storeId חסר. מחזיר 404 אם החנות לא קיימת."
                />

                <RouteSection
                    method="GET"
                    path="/products/:barcode"
                    description="שליפת מוצר בודד לפי ברקוד (item_code)."
                    example={`GET /products/7290000123456`}
                    response={`{
  "itemCode": "7290000123456",
  "itemName": "חלב תנובה 1L"
}`}
                    notes="מחזיר 404 אם הברקוד לא קיים."
                />

                <RouteSection
                    method="GET"
                    path="/products/:barcode/prices"
                    description="שליפת מוצר עם המחיר הנוכחי שלו בכל חנות שמוכרת אותו. ממוין מהזול ליקר."
                    example={`GET /products/7290000123456/prices`}
                    response={`{
  "product": {
    "itemCode": "7290000123456",
    "itemName": "חלב תנובה 1L"
  },
  "prices": [
    {
      "price": "5.90",
      "storeName": "רמי לוי",
      "chain": "רמי לוי שיווק השקמה",
      "city": "תל אביב"
    },
    {
      "price": "6.40",
      "storeName": "שופרסל דיל",
      "chain": "שופרסל",
      "city": "רמת גן"
    }
  ]
}`}
                />

                <RouteSection
                    method="GET"
                    path="/products/:barcode/prices/:storeId"
                    description="שליפת מחיר מוצר בודד בחנות ספציפית."
                    example={`GET /products/7290000123456/prices/12`}
                    response={`{
  "price": "5.90",
  "priceUpdateDate": "2026-03-20T00:00:00.000Z",
  "storeId": 12,
  "storeName": "רמי לוי",
  "city": "תל אביב",
  "chain": "רמי לוי שיווק השקמה"
}`}
                    notes="מחזיר 404 אם הברקוד לא קיים, החנות לא קיימת, או החנות לא מוכרת את המוצר."
                />
            </section>

            {/* Product Groups */}
            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold border-b border-border pb-2">קבוצות מוצרים</h2>
                <p className="text-sm text-muted-foreground">
                    קבוצות מאחדות ברקודים שונים מרשתות שונות שמייצגים את אותו מוצר. שימושי לבניית רשימת קניות — במקום ברקוד ספציפי, שמרו <code className="font-mono text-xs">groupId</code> וה-API ימצא את הברקוד הנכון לכל חנות.
                </p>

                <RouteSection
                    method="GET"
                    path="/products/groups"
                    description="חיפוש קבוצות מוצרים לפי שם."
                    params={[
                        { name: "q", type: "string", description: "חיפוש חופשי בשם הקבוצה (כל המילים חייבות להופיע)" },
                        { name: "page", type: "number", description: "מספר עמוד (ברירת מחדל: 1)" },
                        { name: "limit", type: "number", description: "תוצאות לעמוד (ברירת מחדל: 20)" },
                    ]}
                    example={`GET /products/groups?q=חלב תנובה`}
                    response={`{
  "items": [
    { "id": 42, "name": "חלב תנובה 3% 1L" }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}`}
                />

                <RouteSection
                    method="GET"
                    path="/products/groups/:id"
                    description="שליפת קבוצה בודדת עם כל הברקודים שלה."
                    example={`GET /products/groups/42`}
                    response={`{
  "id": 42,
  "name": "חלב תנובה 3% 1L",
  "products": [
    { "itemCode": "7290000051352", "itemName": "חלב תנובה 3% 1L" },
    { "itemCode": "7290000042015", "itemName": "חלב תנובה 3% 1L" }
  ]
}`}
                    notes="מחזיר 404 אם הקבוצה לא קיימת."
                />

                <RouteSection
                    method="GET"
                    path="/products/groups/:id/prices/:storeId"
                    description="שליפת המחיר הזול ביותר לכל ברקוד בקבוצה בחנות ספציפית. הנתיב המרכזי לחישוב סל קניות."
                    example={`GET /products/groups/42/prices/12`}
                    response={`{
  "groupId": 42,
  "groupName": "חלב תנובה 3% 1L",
  "itemCode": "7290000042015",
  "itemName": "חלב תנובה 3% 1L",
  "price": "5.90",
  "priceUpdateDate": "2026-03-20T00:00:00.000Z",
  "storeId": 12,
  "storeName": "רמי לוי",
  "city": "תל אביב",
  "chain": "רמי לוי שיווק השקמה"
}`}
                    notes="מחזיר 404 אם הקבוצה לא קיימת, החנות לא קיימת, או החנות לא מוכרת אף ברקוד בקבוצה."
                />
            </section>
        </div>
    );
}
