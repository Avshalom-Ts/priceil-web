
import { CodeBlock } from "@/components/code-block";
import { ShellCommand } from "@/components/shell-command";
import { MethodBadge, FieldTable, ErrorTable } from "@/components/docs/endpoint-ui";
import { ApiRequestBar } from "@/components/api-request-bar";
import Link from "next/link";

export default function StoresDocsPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">נתיב הסניפים ברשתות במזון</h1>
        <p className="text-sm text-muted-foreground">
          נתיבים לשליפת רשימת סניפים, סינון לפי עיר ורשת, ושליפת סניף בודד עם
          פרטי הרשת שלו. לרשימת הרשתות עצמן ראו את{" "}
          <Link href="/developers/docs/chains" className="text-primary hover:underline">
            עמוד הרשתות
          </Link>
          .
        </p>
      </header>

      {/* ── GET /stores ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="GET" />
            <code className="font-mono text-sm">/stores</code>
          </div>
          <p className="text-sm text-muted-foreground">
            מחזיר רשימה מדורגת של סניפים. אפשר לסנן לפי עיר ו/או שם רשת.
            כל סניף כולל אובייקט רשת מקונן.
          </p>
          <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Query params</p>
            תומך ב-page ו-limit. ברירת מחדל: page=1, limit=20.
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">פרמטרים אפשריים</h2>
          <FieldTable
            rows={[
              { field: "city", type: "string", required: false, description: "סינון לפי שם עיר או שם סניף (partial match)." },
              { field: "chain", type: "string", required: false, description: "סינון לפי שם רשת (partial match)." },
              { field: "page", type: "number", required: false, description: "מספר עמוד. ברירת מחדל: 1." },
              { field: "limit", type: "number", required: false, description: "תוצאות לעמוד. ברירת מחדל: 20." },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              { label: "Linux / macOS", command: `curl "https://api.priceil.dev/stores?city=תל%20אביב&chain=שופרסל&limit=5"` },
              { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/stores?city=תל אביב&chain=שופרסל&limit=5" | ConvertTo-Json -Depth 10` },
            ]}
          />
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת תשובה (data)</h2>
          <CodeBlock>{`{
  "items": [
    {
      "id": 12,
      "chainId": "7290027600007",
      "subchainId": "1",
      "storeId": "5",
      "subchainName": "שופרסל",
      "storeName": "שופרסל דיל",
      "storeType": 1,
      "address": "דיזנגוף 50",
      "city": "תל אביב",
      "zipcode": "6100000",
      "bikoretNo": 100,
      "lastUpdateDate": "2026-03-20",
      "latitude": "32.0853000",
      "longitude": "34.7817600",
      "chain": {
        "chainId": "7290027600007",
        "chainName": "שופרסל"
      }
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 5
}`}</CodeBlock>
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar initialPath="/stores" initialParams="limit=5" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שדות תגובה — Store</h2>
          <FieldTable
            rows={[
              { field: "id", type: "number", description: "מזהה פנימי של הסניף במסד הנתונים." },
              { field: "chainId", type: "string", description: "מזהה רשמי של הרשת." },
              { field: "subchainId", type: "string", description: "מזהה תת-רשת." },
              { field: "storeId", type: "string", description: "מזהה הסניף כפי שמדווח על-ידי הרשת." },
              { field: "subchainName", type: "string", description: "שם תת-הרשת (לרוב שם הרשת הפנימי)." },
              { field: "storeName", type: "string", description: "שם הסניף לתצוגה." },
              { field: "storeType", type: "number", description: "סוג הסניף (קוד מספרי)." },
              { field: "address", type: "string", description: "כתובת הסניף." },
              { field: "city", type: "string", description: "עיר הסניף." },
              { field: "zipcode", type: "string", description: "מיקוד." },
              { field: "lastUpdateDate", type: "string (date)", description: "תאריך עדכון אחרון של נתוני הסניף." },
              { field: "latitude", type: "string (decimal)", description: "קו רוחב גאוגרפי." },
              { field: "longitude", type: "string (decimal)", description: "קו אורך גאוגרפי." },
              { field: "chain.chainId", type: "string", description: "מזהה רשת (מקונן)." },
              { field: "chain.chainName", type: "string", description: "שם רשת (מקונן)." },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שגיאות נפוצות</h2>
          <ErrorTable />
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">טיפ לשימוש</p>
          הפרמטר city מסנן גם לפי שם סניף (storeName), לא רק לפי שם עיר.
          מיון ברירת מחדל: לפי chainName ואז city. כדי לבנות תפריט סינון מלא, שלבו
          קודם קריאה ל-{" "}
          <Link href="/developers/docs/chains" className="text-primary hover:underline" dir="ltr">
            /stores/chains
          </Link>{" "}
          לשליפת כל הרשתות.
        </div>
      </section>

      {/* ── GET /stores/:id ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <MethodBadge method="GET" />
            <code className="font-mono text-sm">/stores/:id</code>
          </div>
          <p className="text-sm text-muted-foreground">
            שליפת סניף יחיד לפי המזהה הפנימי שלו, כולל פרטי הרשת המקוננת.
            השתמשו בנתיב הזה כשאתם כבר מחזיקים storeId מתוצאת חיפוש קודמת.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-semibold text-foreground">Path param</p>
              <span dir="ltr">id</span> — המזהה הפנימי של הסניף (מספר שלם).
            </div>
            <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-semibold text-foreground">אין Query params</p>
              הנתיב לא תומך בפרמטרים נוספים.
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת בקשה</h2>
          <ShellCommand
            tabs={[
              { label: "Linux / macOS", command: `curl "https://api.priceil.dev/stores/12"` },
              { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/stores/12" | ConvertTo-Json -Depth 10` },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">דוגמת תשובה (data)</h2>
          <CodeBlock>{`{
  "id": 12,
  "chainId": "7290058140886",
  "subchainId": "1",
  "storeId": "5",
  "subchainName": "רמי לוי",
  "storeName": "רמי לוי תל אביב",
  "storeType": 1,
  "address": "רחוב הרצל 1",
  "city": "תל אביב",
  "zipcode": "6100000",
  "bikoretNo": 100,
  "lastUpdateDate": "2026-03-20",
  "latitude": "32.0853000",
  "longitude": "34.7817600",
  "chain": {
    "chainId": "7290058140886",
    "chainName": "רמי לוי שיווק השקמה"
  }
}`}</CodeBlock>
        </div>


        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">נסו בעצמכם</h2>
          <ApiRequestBar initialPath="/stores/12" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">שגיאות נפוצות</h2>
          <ErrorTable
            rows={[
              { status: "404", meaning: "סניף לא נמצא", action: "הציגו הודעה מתאימה למשתמש." },
              { status: "429", meaning: "חריגה ממגבלת קצב", action: "retry עם backoff אקספוננציאלי." },
            ]}
          />
        </div>
      </section>

      {/* ── Usage tips ── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">טיפים לשימוש</h2>
        <ul className="list-disc space-y-1.5 pr-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            לבניית חיפוש חנויות מלא: קראו תחילה ל-
            <Link href="/developers/docs/chains" className="mx-1 text-primary hover:underline" dir="ltr">/stores/chains</Link>
            לשליפת רשימת הרשתות, ואז השתמשו ב-chainName כפרמטר לסינון.
          </li>
          <li>
            שמרו את ה-id (המזהה הפנימי) של הסניף — זהו הערך שתשתמשו בו
            בנתיבי מוצרים כמו{" "}
            <span className="font-mono" dir="ltr">/products/search?storeId=...</span>.
          </li>
          <li>
            latitude ו-longitude הם מחרוזות עשרוניות. המירו ל-float לפני חישוב
            מרחקים.
          </li>
          <li>
            הנתיב <span className="font-mono" dir="ltr">/stores</span> מסנן עם
            ILIKE — חיפוש חלקי שאינו תלוי רישיות. אין צורך בהתאמה מלאה לשם.
          </li>
          <li>
            lastUpdateDate מעדכן לפי התאריך האחרון שבו הרשת דיווחה על עדכון
            לסניף, לא תאריך עדכון מחירים.
          </li>
        </ul>
      </section>
    </div>
  );
}
