import Link from "next/link";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/code-block";
import { Separator } from "@/components/ui/separator";
import { ApiPlayground } from "@/components/api-playground";
import { ShellCommand } from "@/components/shell-command";



export default function DocsPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">מדריך מפתחים לשימוש ב-API</h1>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <div className="max-w-3xl flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                PriceIL API נועד לאפשר למפתחים לבנות חוויות חכמות סביב מחירי סופר,
                חיפוש מוצרים והשוואת סל קניות.
              </p>
              <p>
                ה-API מרכז מידע על מוצרים, סניפים, רשתות ומחירים, כדי שתוכלו לבנות
                אפליקציות שמבינות סל קניות ולא רק פריט בודד. במקום להתמודד
                בעצמכם עם איסוף וארגון של נתוני מחירים ממקורות שונים, אתם
                מקבלים ממשק אחד, מסודר ועקבי, שאפשר לבנות עליו בקלות.
              </p>
              <p>
                ה-API בנוי סביב תרחישי שימוש אמיתיים: מציאת מוצרים, בדיקת מחירים,
                איתור חנויות רלוונטיות והשוואת עלות של סל קניות מלא. לכן
                הדוקומנטציה בעמוד הזה לא עוצרת ברשימת ה- endpoints, אלא מסבירה גם איך
                לחבר ביניהם לכדי חוויית מוצר שלמה.
              </p>

              <p>
                ברוב המוצרים הזרימה מתחילה בשאלה פשוטה של המשתמש: איזה מוצר לקנות,
                איפה הוא נמצא, וכמה יעלה לי הסל המלא. ה-API תומך בדיוק בזרימה הזו.
                קודם מאתרים מוצרים וחנויות, אחר כך מתקדמים למחירים של פריטים בודדים,
                ולבסוף מריצים השוואת סל מלאה כדי לקבל תמונה שימושית באמת.
              </p>
              <p>
                זאת הסיבה שטוב לכלול כאן גם תוכן הסברי ולא רק reference טכני. עמוד
                הפתיחה צריך לעזור למפתח להבין את המודל המנטלי של המערכת לפני שהוא
                נכנס לפרטי כל endpoint. את ה-routes המלאים שומרים בעמודים הייעודיים,
                אבל כאן נכון לספר מה אפשר לבנות עם ה-API ואיך לגשת אליו נכון.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">מה צריך לדעת כדי להתחיל לבנות</h2>
        <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            כדי להתחיל לעבוד עם ה-API צריך לדעת שלושה דברים בסיסיים: לאיזה base
            URL לפנות, האם אתם עובדים עם מפתח API, ומהי הבקשה הראשונה שכדאי
            להריץ כדי לוודא שהאינטגרציה שלכם תקינה.
          </p>
          <div className="space-y-3 rounded-xl border border-border p-4">
            {/* Base URL */}
            <section className="flex justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-primary" />
                  <h2 className="text-lg font-bold tracking-tight">כתובת הבסיס</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  כל נקודות הקצה מתחילות בכתובת הזאת.
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <Button>
                  <Link href="https://api.priceil.dev" target="_blank" rel="noopener noreferrer">
                    פתח בטאב חדש לראות את הנתיבים האפשריים
                  </Link>
                </Button>
                <CodeBlock className="text-sm pr-12 py-2 text-left">{`https://api.priceil.dev`}</CodeBlock>
              </div>
            </section>
            <Separator />
            <p>
              בקשות חינמיות יכולות להישלח ללא header נוסף, אבל אם יש לכם מפתח
              בתוכנית בתשלום, הוסיפו את <span dir="ltr">x-api-key</span> לכל
              בקשה כדי לקבל את מגבלת הקצב המתאימה.
            </p>
            <p>
              נקודת התחלה טובה היא חיפוש מוצר פשוט, כי הוא מאפשר לבדוק מיד את
              מבנה התגובה, את החיבור לרשת ואת אופן העבודה עם query parameters.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">התחלה מהירה ב-3 שלבים</h2>
        <ol className="grid gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-xl border border-border p-4">
            <p className="font-semibold">1. בחירת ה - endpoint</p>
            <p className="mt-1 text-muted-foreground">
              התחילו ב-Products או Stores כדי לאסוף מזהים (barcode / storeId).
            </p>
          </li>
          <li className="rounded-xl border border-border p-4">
            <p className="font-semibold">2. בדיקת בקשה עם curl</p>
            <p className="mt-1 text-muted-foreground">
              ודאו שאתם מקבלים data תקין לפני חיבור ל-UI או backend שלכם.
            </p>
          </li>
          <li className="rounded-xl border border-border p-4">
            <p className="font-semibold">3. קשיחות לפרודקשן</p>
            <p className="mt-1 text-muted-foreground">
              הוסיפו timeout, retry עם backoff, ו-cache לשאילתות נפוצות.
            </p>
          </li>
        </ol>
        <ApiPlayground />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">מעטפת תגובה אחידה</h2>
        <p className="text-sm text-muted-foreground">
          כל נקודות הקצה מוחזרות במעטפת סטנדרטית.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-500">
              Success response
            </p>
            <CodeBlock>{`{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-25T07:10:00.000Z"
}`}</CodeBlock>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-500">
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
        <h2 className="text-xl font-semibold">כללי בקשה מומלצים</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-right font-semibold">נושא</th>
                <th className="px-4 py-2.5 text-right font-semibold">המלצה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-2.5">Pagination</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  השתמשו ב-page ו-limit ותשמרו limit יציב (למשל 20-50) לחוויית משתמש עקבית.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">Query encoding</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  קודדו פרמטרים עם encodeURIComponent כדי למנוע תווים בעייתיים.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">ID types</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  storeId לרוב מספרי, barcode לרוב מחרוזת. שמרו על הטיפוס המקורי מקצה לקצה.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">Latency</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  הגדירו timeout ברמת הלקוח כדי להימנע מבקשות תקועות.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">Caching</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  תוצאות חיפוש ורשימות רשתות מתאימות ל-cache קצר להפחתת עומסים.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">הרשמה והגבלת בקשות</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-right font-semibold">סוג</th>
                <th className="px-4 py-2.5 text-right font-semibold">כותרת</th>
                <th className="px-4 py-2.5 text-right font-semibold">מגבלה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-2.5">חינם</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  אין
                </td>
                <td className="px-4 py-2.5">20 בקשות / 60 שניות</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">בתשלום</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  x-api-key: &lt;key&gt;
                </td>
                <td className="px-4 py-2.5">500 בקשות / 60 שניות</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          אם אתם רוצים לשלב ניהול בתוך האפליקציה שלכם, כל אפליקציה רשומה מקבלת
          מפתח משלה. כך אפשר לשלוח את ה-API key לכתובת הזאת ולעקוב אחרי השימוש של אותה אפליקציה בלבד.
        </p>
        <ShellCommand
          tabs={[
            { label: "Linux / macOS", command: `curl -H "x-api-key: your-app-key" "https://api.priceil.dev/me"` },
            { label: "Windows (PowerShell)", command: `Invoke-RestMethod -Uri "https://api.priceil.dev/me" -Headers @{"x-api-key"="your-app-key"} | ConvertTo-Json` },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          אם האפליקציה עוברת את המגבלה, תקבלו סטטוס 429. מומלץ ליישם retry עם backoff.
        </p>
        <p className="text-base text-muted-foreground">
          לפירוט התוכניות, מגבלות המכסה החודשית ואפשרויות השדרוג, ראו את{" "}
          <Link href="/developers/plans" className="text-primary hover:underline font-bold">
            עמוד התוכניות
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">טיפול בשגיאות ויציבות האינטגרציה</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-right font-semibold">סטטוס</th>
                <th className="px-4 py-2.5 text-right font-semibold">משמעות</th>
                <th className="px-4 py-2.5 text-right font-semibold">פעולה מומלצת</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-2.5" dir="ltr">400</td>
                <td className="px-4 py-2.5">פרמטרים לא תקינים</td>
                <td className="px-4 py-2.5 text-muted-foreground">ולידציה מוקדמת בצד לקוח/שרת לפני שליחה.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5" dir="ltr">404</td>
                <td className="px-4 py-2.5">ישות לא נמצאה</td>
                <td className="px-4 py-2.5 text-muted-foreground">הציגו fallback ברור למשתמש במקום כשל כללי.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5" dir="ltr">429</td>
                <td className="px-4 py-2.5">חריגה ממגבלת קצב</td>
                <td className="px-4 py-2.5 text-muted-foreground">retry עם backoff אקספוננציאלי + jitter.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5" dir="ltr">5xx</td>
                <td className="px-4 py-2.5">שגיאת שרת</td>
                <td className="px-4 py-2.5 text-muted-foreground">נסו שוב מספר קטן של פעמים, תעדו לוגים מלאים.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>דוגמא לשימוש ב-retry עם backoff אקספוננציאלי:</p>
        <CodeBlock>{`async function withRetry(requestFn, retries = 3) {
  let attempt = 0;

  while (attempt <= retries) {
    const res = await requestFn();
    if (res.ok) return res;

    if (res.status !== 429 && res.status < 500) {
      throw new Error("Non-retryable error");
    }

    const backoffMs = (2 ** attempt) * 250 + Math.floor(Math.random() * 150);
    await new Promise((r) => setTimeout(r, backoffMs));
    attempt += 1;
  }

  throw new Error("Request failed after retries");
}`}</CodeBlock>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">צריכים עזרה?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          אם יש לכם שאלות, בעיות או הצעות, אנחנו כאן כדי לעזור. פנו אלינו ישירות
          דרך טופס ההתקשרות שלנו.
        </p>
        <div>
          <Button asChild>
            <Link href="/contact">
              צור קשר
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
