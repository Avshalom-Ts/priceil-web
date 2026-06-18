import { CodeBlock } from "@/components/code-block";
import { ShellCommand } from "@/components/shell-command";
import { MethodBadge, FieldTable, ErrorTable } from "@/components/docs/endpoint-ui";
import { ApiRequestBar } from "@/components/api-request-bar";
import Link from "next/link";

const PRODUCT_FIELDS = [
  { field: "itemCode", type: "string", description: "ברקוד המוצר (מזהה ייחודי)." },
  { field: "itemName", type: "string", description: "שם המוצר." },
  { field: "itemType", type: "number", description: "קוד סוג המוצר." },
  { field: "manufacturerName", type: "string", description: "שם היצרן." },
  { field: "manufactureCountry", type: "string", description: "ארץ ייצור." },
  { field: "manufacturerDescription", type: "string", description: "תיאור היצרן." },
  { field: "unitQty", type: "string", description: "תווית כמות יחידה." },
  { field: "quantity", type: "string (decimal)", description: "כמות באריזה." },
  { field: "isWeighted", type: "boolean", description: "האם המוצר נמכר לפי משקל." },
  { field: "unitOfMeasure", type: "string", description: "יחידת מידה." },
  { field: "qtyInPackage", type: "number", description: "יחידות באריזה." },
];

export default function ProductsDocsPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">נתיבי המוצרים</h1>
        <p className="text-sm text-muted-foreground">
          נתיבים לחיפוש מוצרים, שליפת מחירים לפי ברקוד ושם, חיפוש בתוך סניף ספציפי,
          וניהול קבוצות מוצרים. קבוצות מוצרים מאפשרות להתמודד עם הבדלי ברקוד בין רשתות
          לאותו מוצר.
        </p>
      </header>

      {/* ── GET /products ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="GET" />
            <code className="font-mono text-sm">/products</code>
          </div>
          <p className="text-sm text-muted-foreground">
            חיפוש מוצרים בכל הרשתות לפי שם חופשי. המערכת מריצה חיפוש בשלושה
            מעברים: התאמה מלאה לביטוי, כל המילים, לפחות מילה אחת — ומדרגת
            לפי רלוונטיות. מחזיר bestMatch ורשימה מדורגת.
          </p>
          <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Query params</p>
            כולם אופציונליים. ללא q מוחזרים כל המוצרים עם pagination.
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">פרמטרים</h2>
          <FieldTable
            rows={[
              { field: "q", type: "string", required: false, description: "חיפוש חופשי בשם מוצר." },
              { field: "page", type: "number", required: false, description: "מספר עמוד. ברירת מחדל: 1." },
              { field: "limit", type: "number", required: false, description: "תוצאות לעמוד. ברירת מחדל: 20." },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              { label: "Linux / macOS", command: `curl "https://api.priceil.dev/products?q=חלב&limit=5"` },
              { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/products?q=חלב&limit=5" | ConvertTo-Json -Depth 10` },
            ]}
          />
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת תשובה (data)</h2>
          <CodeBlock>{`{
  "bestMatch": {
    "itemCode": "7290000123456",
    "itemName": "חלב תנובה 1L",
    "itemType": 1,
    "manufacturerName": "תנובה",
    "quantity": "1.000",
    "isWeighted": false,
    "unitOfMeasure": "100 מל"
  },
  "allOthers": [
    { "itemCode": "7290000054321", "itemName": "חלב תנובה 3% 500ml", "..." : "..." }
  ],
  "total": 342,
  "page": 1,
  "limit": 5
}`}</CodeBlock>
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar initialPath="/products" initialParams="q=חלב תנובה&limit=5" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שדות תגובה</h2>
          <FieldTable rows={PRODUCT_FIELDS} />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שגיאות נפוצות</h2>
          <ErrorTable rows={[
            { status: "400", meaning: "פרמטר page/limit לא תקין", action: "ולידציה בצד לקוח לפני שליחה." },
            { status: "429", meaning: "חריגה ממגבלת קצב", action: "retry עם backoff אקספוננציאלי." },
            { status: "500", meaning: "שגיאת שרת", action: "נסו שוב מאוחר יותר." },
          ]} />
        </div>
      </section>

      {/* ── GET /products/search ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="GET" />
            <code className="font-mono text-sm">/products/search</code>
          </div>
          <p className="text-sm text-muted-foreground">
            חיפוש מוצרים בתוך סניף ספציפי. כל תוצאה כוללת את מחיר המוצר בסניף
            שנבחר. storeId הוא פרמטר חובה.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">פרמטרים</h2>
          <FieldTable
            rows={[
              { field: "q", type: "string", required: false, description: "חיפוש חופשי בשם מוצר." },
              { field: "storeId", type: "number", required: true, description: "מזהה פנימי של הסניף (חובה)." },
              { field: "page", type: "number", required: false, description: "מספר עמוד. ברירת מחדל: 1." },
              { field: "limit", type: "number", required: false, description: "תוצאות לעמוד. ברירת מחדל: 20." },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              { label: "Linux / macOS", command: `curl "https://api.priceil.dev/products/search?q=חלב&storeId=12&limit=5"` },
              { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/products/search?q=חלב&storeId=12&limit=5" | ConvertTo-Json -Depth 10` },
            ]}
          />
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת תשובה (data)</h2>
          <CodeBlock>{`{
  "items": [
    {
      "itemCode": "7290000051352",
      "itemName": "חלב תנובה 3% 1L",
      "price": "5.90",
      "priceUpdateDate": "2026-03-20T00:00:00.000Z",
      "storeId": 12,
      "storeName": "רמי לוי",
      "city": "תל אביב",
      "address": "רחוב הרצל 1",
      "chain": "רמי לוי שיווק השקמה"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 5
}`}</CodeBlock>
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar initialPath="/products/search" initialParams="q=חלב תנובה&storeId=12&limit=5" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שגיאות נפוצות</h2>
          <ErrorTable rows={[
            { status: "400", meaning: "storeId חסר או לא תקין", action: "ודאו שstoreId מספרי ונשלח." },
            { status: "404", meaning: "סניף לא נמצא", action: "בדקו שה-storeId קיים." },
            { status: "429", meaning: "חריגה ממגבלת קצב", action: "retry עם backoff." },
          ]} />
        </div>
      </section>

      {/* ── GET /products/:barcode ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="GET" />
            <code className="font-mono text-sm">/products/:barcode</code>
          </div>
          <p className="text-sm text-muted-foreground">
            שליפת מוצר יחיד לפי ברקוד (itemCode). מחזיר את פרטי המוצר בלבד,
            ללא מחירים. לשליפת מחירים השתמשו ב-/products/:barcode/prices.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              { label: "Linux / macOS", command: `curl "https://api.priceil.dev/products/7290000051352"` },
              { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/products/7290000051352" | ConvertTo-Json` },
            ]}
          />
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת תשובה (data)</h2>
          <CodeBlock>{`{
  "itemCode": "7290000051352",
  "itemName": "חלב תנובה 3% 1L",
  "itemType": 1,
  "manufacturerName": "תנובה",
  "manufactureCountry": "IL",
  "manufacturerDescription": "תנובה מרכז שיתופי",
  "unitQty": "ליטר",
  "quantity": "1.000",
  "isWeighted": false,
  "unitOfMeasure": "100 מל",
  "qtyInPackage": 1
}`}</CodeBlock>
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar initialPath="/products/7290000051352" initialParams="" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שגיאות נפוצות</h2>
          <ErrorTable rows={[
            { status: "404", meaning: "ברקוד לא נמצא", action: "בדקו את הברקוד." },
            { status: "429", meaning: "חריגה ממגבלת קצב", action: "retry עם backoff." },
          ]} />
        </div>
      </section>

      {/* ── GET /products/:barcode/prices ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="GET" />
            <code className="font-mono text-sm">/products/:barcode/prices</code>
          </div>
          <p className="text-sm text-muted-foreground">
            מחזיר מוצר עם מחיריו בכל החנויות שנושאות אותו, ממויין מהזול לאחרון.
            זהו הנתיב המרכזי לבניית מסך השוואת מחירים.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              { label: "Linux / macOS", command: `curl "https://api.priceil.dev/products/7290000051352/prices"` },
              { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/products/7290000051352/prices" | ConvertTo-Json -Depth 10` },
            ]}
          />
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת תשובה (data)</h2>
          <CodeBlock>{`{
  "product": { "itemCode": "7290000051352", "itemName": "חלב תנובה 3% 1L", "..." : "..." },
  "prices": [
    {
      "price": "5.90",
      "priceUpdateDate": "2026-03-20T00:00:00.000Z",
      "storeId": 12,
      "storeName": "רמי לוי",
      "city": "תל אביב",
      "chain": "רמי לוי שיווק השקמה"
    },
    {
      "price": "6.40",
      "storeId": 34,
      "storeName": "שופרסל דיל",
      "city": "רמת גן",
      "chain": "שופרסל"
    }
  ]
}`}</CodeBlock>
          <p className="text-xs text-muted-foreground">
            prices ממויין לפי price עולה — הזול ביותר ראשון.
          </p>
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar initialPath="/products/7290000051352/prices" initialParams="" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שגיאות נפוצות</h2>
          <ErrorTable rows={[
            { status: "404", meaning: "ברקוד לא נמצא", action: "בדקו את הברקוד." },
            { status: "429", meaning: "חריגה ממגבלת קצב", action: "retry עם backoff." },
          ]} />
        </div>
      </section>

      {/* ── GET /products/:barcode/prices/:storeId ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="GET" />
            <code className="font-mono text-sm">/products/:barcode/prices/:storeId</code>
          </div>
          <p className="text-sm text-muted-foreground">
            מחיר מוצר ספציפי בסניף ספציפי. מחזיר 404 גם אם הסניף קיים אבל לא
            נושא את המוצר.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              { label: "Linux / macOS", command: `curl "https://api.priceil.dev/products/7290000051352/prices/12"` },
              { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/products/7290000051352/prices/12" | ConvertTo-Json` },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת תשובה (data)</h2>
          <CodeBlock>{`{
  "price": "5.90",
  "priceUpdateDate": "2026-03-20T00:00:00.000Z",
  "storeId": 12,
  "storeName": "רמי לוי",
  "city": "תל אביב",
  "address": "רחוב הרצל 1",
  "chain": "רמי לוי שיווק השקמה"
}`}</CodeBlock>
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar initialPath="/products/7290000051352/prices/12" initialParams="" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שגיאות נפוצות</h2>
          <ErrorTable rows={[
            { status: "404", meaning: "ברקוד / סניף לא נמצא, או הסניף לא נושא מוצר זה", action: "הציגו fallback מתאים." },
            { status: "429", meaning: "חריגה ממגבלת קצב", action: "retry עם backoff." },
          ]} />
        </div>
      </section>

      {/* ── Product Groups ── */}
      <section className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-muted/20 p-5">
          <h2 className="mb-2 text-xl font-semibold">קבוצות מוצרים</h2>
          <p className="text-sm text-muted-foreground">
            קבוצות מנרמלות ברקודים שונים מרשתות שונות לאותו מוצר. כשבונים
            רשימת קניות — עדיף לשמור groupId ולא ברקוד ספציפי, כי ה-API ימצא
            את הברקוד הנכון לכל סניף בעצמו.
          </p>
        </div>
      </section>

      {/* ── GET /products/groups ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="GET" />
            <code className="font-mono text-sm">/products/groups</code>
          </div>
          <p className="text-sm text-muted-foreground">
            חיפוש קבוצות מוצרים לפי שם. כל קבוצה כוללת את הברקודים המשויכים
            לה. מחזיר אותה מבנה bestMatch/allOthers כמו /products.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">פרמטרים</h2>
          <FieldTable
            rows={[
              { field: "q", type: "string", required: false, description: "חיפוש בשם הקבוצה." },
              { field: "page", type: "number", required: false, description: "מספר עמוד. ברירת מחדל: 1." },
              { field: "limit", type: "number", required: false, description: "תוצאות לעמוד. ברירת מחדל: 20." },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              { label: "Linux / macOS", command: `curl "https://api.priceil.dev/products/groups?q=חלב תנובה&limit=5"` },
              { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/products/groups?q=חלב תנובה&limit=5" | ConvertTo-Json -Depth 10` },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar initialPath="/products/groups" initialParams="q=חלב תנובה&limit=5" />
        </div>
      </section>

      {/* ── GET /products/groups/:id/prices/:storeId ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="GET" />
            <code className="font-mono text-sm">/products/groups/:id/prices/:storeId</code>
          </div>
          <p className="text-sm text-muted-foreground">
            המחיר הזול ביותר לקבוצת מוצרים בסניף ספציפי. ה-API בוחר את הברקוד
            הנכון שהסניף נושא מתוך כל הברקודים בקבוצה.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              { label: "Linux / macOS", command: `curl "https://api.priceil.dev/products/groups/42/prices/12"` },
              { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/products/groups/42/prices/12" | ConvertTo-Json` },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת תשובה (data)</h2>
          <CodeBlock>{`{
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
}`}</CodeBlock>
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar initialPath="/products/groups/42/prices/12" initialParams="" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שדות תגובה</h2>
          <FieldTable rows={[
            { field: "groupId", type: "number", description: "מזהה קבוצת המוצרים." },
            { field: "groupName", type: "string", description: "שם הקבוצה המנורמל." },
            { field: "itemCode", type: "string", description: "הברקוד הספציפי שהסניף נושא." },
            { field: "itemName", type: "string", description: "שם המוצר כפי שמופיע ברשת." },
            { field: "price", type: "string (decimal)", description: "המחיר הזמין בסניף בשקלים." },
            { field: "priceUpdateDate", type: "timestamptz", description: "תאריך עדכון המחיר האחרון." },
            { field: "storeId", type: "number", description: "מזהה פנימי של הסניף." },
            { field: "storeName", type: "string", description: "שם הסניף." },
            { field: "city", type: "string", description: "עיר הסניף." },
            { field: "address", type: "string", description: "כתובת הסניף." },
            { field: "chain", type: "string", description: "שם הרשת." },
          ]} />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שגיאות נפוצות</h2>
          <ErrorTable rows={[
            { status: "404", meaning: "קבוצה / סניף לא נמצאו, או הסניף לא נושא אף ברקוד מהקבוצה", action: "הציגו fallback מתאים." },
            { status: "429", meaning: "חריגה ממגבלת קצב", action: "retry עם backoff." },
          ]} />
        </div>
      </section>

      {/* ── Tips ── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">טיפים לשימוש</h2>
        <ul className="list-disc space-y-1.5 pr-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            לחיפוש ראשוני בלי סניף — השתמשו ב-
            <span className="font-mono mx-1" dir="ltr">/products?q=...</span>
            לאיסוף ברקודים, ואז העבירו אותם ל-
            <span className="font-mono mx-1" dir="ltr">/products/:barcode/prices</span>
            לבניית השוואה.
          </li>
          <li>
            לרשימות קניות — עדיף לשמור groupId ולא ברקוד, כי קבוצות עובדות על
            פני כל הרשתות. השתמשו בנתיב{" "}
            <span className="font-mono" dir="ltr">/products/groups/:id/prices/:storeId</span>
            {" "}לקבלת מחיר מדויק לכל סניף.
          </li>
          <li>
            isWeighted=true מציין מוצר שנמכר לפי משקל. מחירו יהיה ל-100 גרם
            ולא ליחידה.
          </li>
          <li>
            priceUpdateDate הוא תאריך העדכון האחרון שהרשת דיווחה לממשלה, לא
            תאריך העדכון במסד הנתונים שלנו.
          </li>
          <li>
            לשילוב עם סניפים: קראו ל-
            <Link href="/developers/docs/stores" className="mx-1 text-primary hover:underline" dir="ltr">/stores</Link>
            קודם לאיסוף storeId, ואז השתמשו בו בנתיבי המחיר.
          </li>
        </ul>
      </section>
    </div>
  );
}

