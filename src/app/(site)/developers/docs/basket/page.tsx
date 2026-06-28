

import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { ShellCommand } from "@/components/shell-command";
import { MethodBadge, FieldTable, ErrorTable } from "@/components/docs/endpoint-ui";
import { ApiRequestBar } from "@/components/api-request-bar";

const COMPARE_REQUEST = `{
  "barcodes": ["7290000051352"],
  "groupIds": [42]
}`;

const TOTAL_REQUEST = `{
  "storeId": 12,
  "barcodes": ["7290000051352"],
  "groupIds": [42]
}`;

export default function BasketDocsPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">נתיבי סל קניות</h1>
        <p className="text-sm text-muted-foreground">
          נתיבים לחישוב סל מוצרים מלא: השוואה בין סניפים עם דירוג מהזול ליקר,
          וחישוב סל בחנות ספציפית עם פירוט לכל פריט. כדי לקבל groupIds לסל,
          התחילו ב-
          <Link href="/developers/docs/products" className="mx-1 text-primary hover:underline" dir="ltr">
            /products/groups
          </Link>
          ומשם עברו להשוואת סל.
        </p>
      </header>

      {/* ── POST /basket/compare ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="POST" />
            <code className="font-mono text-sm">/basket/compare</code>
          </div>
          <p className="text-sm text-muted-foreground">
            משווה את עלות סל הקניות בין כלל הסניפים שמצאו לפחות פריט אחד מהבקשה.
            התשובה ממוינת כברירת מחדל לפי total עולה, כך שהסניף הזול ביותר מופיע ראשון.
          </p>
          <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Body בלבד (JSON)</p>
            אין Query params. אפשר לשלוח barcodes, groupIds או שילוב של שניהם.
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שדות בקשה</h2>
          <FieldTable
            rows={[
              { field: "barcodes", type: "string[]", required: false, description: "רשימת ברקודים להשוואה בין סניפים." },
              { field: "groupIds", type: "number[]", required: false, description: "קבוצות מוצרים (מ- /products/groups)." },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            חייבים לשלוח לפחות אחד מהשדות: barcodes או groupIds.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              {
                label: "Linux / macOS",
                command: `curl -X POST "https://api.priceil.dev/basket/compare" -H "Content-Type: application/json" -d '${COMPARE_REQUEST}'`,
              },
              {
                label: "Windows (PowerShell)",
                command: `Invoke-RestMethod -Method Post -Uri "https://api.priceil.dev/basket/compare" -ContentType "application/json" -Body '${COMPARE_REQUEST}' | ConvertTo-Json -Depth 10`,
              },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת תשובה (data)</h2>
          <CodeBlock>{`[
  {
    "storeId": 12,
    "storeName": "רמי לוי",
    "chain": "רמי לוי שיווק השקמה",
    "city": "תל אביב",
    "address": "רחוב הרצל 1",
    "total": 84.2,
    "found": 2,
    "missing": []
  },
  {
    "storeId": 34,
    "storeName": "שופרסל דיל",
    "chain": "שופרסל",
    "city": "רמת גן",
    "address": "ביאליק 5",
    "total": 90.1,
    "found": 1,
    "missing": ["7290012479843", "group:42"]
  }
]`}</CodeBlock>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar
            requestMethod="POST"
            initialPath="/basket/compare"
            initialBody={COMPARE_REQUEST}
            placeholderBody='{"barcodes":["7290000051352"],"groupIds":[42]}'
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שדות תגובה</h2>
          <FieldTable
            rows={[
              { field: "storeId", type: "number", description: "מזהה פנימי של הסניף." },
              { field: "storeName", type: "string", description: "שם הסניף." },
              { field: "chain", type: "string", description: "שם הרשת של הסניף." },
              { field: "city", type: "string", description: "עיר הסניף." },
              { field: "address", type: "string", description: "כתובת הסניף." },
              { field: "total", type: "number", description: "עלות כוללת של הפריטים שנמצאו (NIS)." },
              { field: "found", type: "number", description: "כמה פריטים מהבקשה נמצאו בסניף." },
              { field: "missing", type: "string[]", description: "פריטים שלא נמצאו (ברקוד או group:id)." },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שגיאות נפוצות</h2>
          <ErrorTable
            rows={[
              { status: "400", meaning: "Body לא תקין או חסר", action: "שלחו JSON תקין עם לפחות barcodes או groupIds." },
              { status: "404", meaning: "ברקוד או groupId לא קיימים", action: "וודאו שכל המזהים קיימים לפני ההשוואה." },
              { status: "429", meaning: "חריגה ממגבלת קצב", action: "retry עם backoff אקספוננציאלי." },
            ]}
          />
        </div>
      </section>

      {/* ── POST /basket/total ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="POST" />
            <code className="font-mono text-sm">/basket/total</code>
          </div>
          <p className="text-sm text-muted-foreground">
            מחשב סל עבור חנות יחידה בלבד. מעבר לסכום הכולל, התשובה כוללת items עם פירוט
            פריט-פריט ושדה fallback שמסביר איך המחיר הושג.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שדות בקשה</h2>
          <FieldTable
            rows={[
              { field: "storeId", type: "number", required: true, description: "מזהה פנימי של הסניף לחישוב הסל." },
              { field: "barcodes", type: "string[]", required: false, description: "ברקודים מפורשים להשוואה." },
              { field: "groupIds", type: "number[]", required: false, description: "קבוצות מוצרים לפי /products/groups." },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              {
                label: "Linux / macOS",
                command: `curl -X POST "https://api.priceil.dev/basket/total" -H "Content-Type: application/json" -d '${TOTAL_REQUEST}'`,
              },
              {
                label: "Windows (PowerShell)",
                command: `Invoke-RestMethod -Method Post -Uri "https://api.priceil.dev/basket/total" -ContentType "application/json" -Body '${TOTAL_REQUEST}' | ConvertTo-Json -Depth 10`,
              },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת תשובה (data)</h2>
          <CodeBlock>{`{
  "storeId": 12,
  "storeName": "רמי לוי",
  "chain": "רמי לוי שיווק השקמה",
  "city": "תל אביב",
  "address": "רחוב הרצל 1",
  "total": 32.8,
  "found": 2,
  "missing": [],
  "items": [
    {
      "name": "חלב תנובה 3% 1L",
      "itemCode": "7290000051352",
      "price": 6.9,
      "fallback": null
    },
    {
      "name": "אורז בסמטי 1kg",
      "itemCode": "7290012479843",
      "price": 25.9,
      "fallback": "name"
    }
  ]
}`}</CodeBlock>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar
            requestMethod="POST"
            initialPath="/basket/total"
            initialBody={TOTAL_REQUEST}
            placeholderBody='{"storeId":12,"barcodes":["7290000051352"],"groupIds":[42]}'
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שדות fallback ב-items</h2>
          <FieldTable
            rows={[
              { field: "fallback = null", type: "null", description: "הפריט נמצא ישירות בברקוד בחנות הזאת." },
              { field: "fallback = name", type: "string", description: "לא נמצא בברקוד, נמצאה התאמה לפי שם בחנות." },
              { field: "fallback = chain", type: "string", description: "לא נמצא בחנות, המחיר הושאל מסניף אחר באותה רשת." },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שגיאות נפוצות</h2>
          <ErrorTable
            rows={[
              { status: "400", meaning: "storeId חסר או לא תקין", action: "שלחו storeId מספרי תקין." },
              { status: "404", meaning: "חנות, ברקוד או groupId לא נמצאו", action: "וודאו שכל המזהים קיימים." },
              { status: "429", meaning: "חריגה ממגבלת קצב", action: "retry עם backoff אקספוננציאלי." },
            ]}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="mb-1 font-semibold text-foreground">זרימת עבודה מומלצת</p>
        התחילו באיתור מוצרים וקבוצות מתוך
        <Link href="/developers/docs/products" className="mx-1 text-primary hover:underline">
          עמוד המוצרים
        </Link>
        , שלחו את הסל ל-/basket/compare כדי למצוא את הסניפים הזולים,
        ואז רוצו עם /basket/total על storeId ספציפי כדי להציג פירוט מלא למשתמש.
      </section>
    </div>
  );
}
