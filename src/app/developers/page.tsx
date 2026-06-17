import Link from "next/link";
import {
  Zap,
  ShoppingCart,
  Store,
  Package,
  Key,
  Terminal,
  CheckCircle2,
  Lock,
  RefreshCw,
  Building2,
  Book,
  Globe,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/login-button";
import { ApiPlayground } from "@/components/api-playground";
import { CodeBlock } from "@/components/code-block";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DevelopersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col gap-14 container mx-auto px-4 py-10 max-w-6xl">
      {/* Hero */}
      <header className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            השתמשו עם נתוני הסופרמרקטים בישראל
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-center text-muted-foreground">
            PriceIL חושפת נתוני מחירים בזמן אמת מכל רשתות הסופרמרקטים הגדולות בישראל
            דרך REST API פשוט. חפשו מוצרים, השוו מחירים בין חנויות, ובנו כלי אופטימיזציה לסל הקניות
            — ללא צורך בהרשמה כדי להתחיל.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm" className="gap-2">
              <Link href="/developers/docs/products">
                <Terminal className="size-3.5" />
                לנקודות הקצה
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/search">
                נסו את הדמו החי
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Base URL */}
      <section className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">כתובת הבסיס</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            כל נקודות הקצה מתחילות בכתובת הזאת.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex-1">
            <CodeBlock className="text-sm">{`https://api.priceil.dev`}</CodeBlock>
          </div>
          <Button className="mt-2">
            <Link href="https://api.priceil.dev" target="_blank" rel="noopener noreferrer">
              פתח בטאב חדש לראות את הנתיבים האפשריים
            </Link>
          </Button>
        </div>
      </section>

      {/* What you can build */}
      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">מה ה-API מנגיש לכם?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            API אחד, נתוני מחירים אמיתיים, אפשרויות אין-סופיות.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: <Package className="size-5 text-primary" />,
              title: "חיפוש מחיר מוצר",
              desc: "חפשו כל מוצר לפי שם או ברקוד וקבלו את מחירו בכל חנות בישראל.",
            },
            {
              icon: <Store className="size-5 text-primary" />,
              title: "איתור חנויות",
              desc: "הציגו וסננו חנויות לפי עיר או רשת. מצאו את הסניף הקרוב עם המחירים הטובים.",
            },
            {
              icon: <ShoppingCart className="size-5 text-primary" />,
              title: "השוואת סל קניות",
              desc: "שלחו רשימת מוצרים וקבלו דירוג של איזו חנות ממלאת את הסל הזול ביותר.",
            },
            {
              icon: <Zap className="size-5 text-primary" />,
              title: "חינמי להתחלה",
              desc: "20 בקשות לדקה ללא הרשמה. צרו חשבון וקבלו מיד 500 בקשות לדקה עם מפתח API.",
            },
            {
              icon: <RefreshCw className="size-5 text-primary" />,
              title: "נתונים עדכניים",
              desc: "המחירים מתעדכנים באופן שוטף ישירות מהרשתות בהתאם לחוק שקיפות המחירים.",
            },
            {
              icon: <Building2 className="size-5 text-primary" />,
              title: "כיסוי מלא של הרשתות",
              desc: "שופרסל, רמי לוי, ויקטורי, מגה ועוד — מאות סניפים ברחבי הארץ בנקודת קצה אחת.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
            >
              {item.icon}
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Endpoints quick-reference */}
      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">נקודות קצה</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            רשימה מהירה של כל הנתיבים הזמינים. רוב הנתיבים תומכים בפרמטרים{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">page</code> ו-
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">limit</code>{" "}
            לדפדוף בתוצאות.
          </p>
        </div>
        <div dir="ltr" className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-3 font-semibold text-muted-foreground">Method</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Path</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {([
                { method: "GET", path: "/products?q=&page=&limit=", desc: "Search products by name" },
                { method: "GET", path: "/products/:barcode", desc: "Get product by barcode" },
                { method: "GET", path: "/products/:barcode/prices", desc: "Prices across all stores" },
                { method: "GET", path: "/products/:barcode/prices/:storeId", desc: "Price in a specific store" },
                { method: "GET", path: "/products/search?q=&storeId=&page=&limit=", desc: "Search products inside a store" },
                { method: "GET", path: "/products/groups?q=&page=&limit=", desc: "Search product groups" },
                { method: "GET", path: "/products/groups/:id", desc: "Get group with all member barcodes" },
                { method: "GET", path: "/products/groups/:id/prices/:storeId", desc: "Cheapest group match in store" },
                { method: "GET", path: "/stores?city=&chain=&page=&limit=", desc: "List / filter stores" },
                { method: "GET", path: "/stores/chains", desc: "Chains summary" },
                { method: "GET", path: "/stores/:id", desc: "Get store by ID" },
                { method: "POST", path: "/basket/compare", desc: "Compare basket cost across stores" },
              ] as { method: string; path: string; desc: string }[]).map((row) => (
                <tr key={row.path} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${row.method === "POST"
                        ? "bg-orange-500/15 text-orange-400"
                        : "bg-blue-500/15 text-blue-400"
                        }`}
                    >
                      {row.method}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">{row.path}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick start / Playground */}
      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">נסו בעצמכם</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            בחרו דוגמה, ערכו את הנתיב והפרמטרים ולחצו שלח.
          </p>
        </div>
        <ApiPlayground />
      </section>

      {/* Response format */}
      <section className="flex flex-col gap-5">
        <div className="flex items-start gap-2">
          <Code2 className="size-4 mt-1 text-primary shrink-0" />
          <div>
            <h2 className="text-xl font-bold tracking-tight">מבנה התשובה</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              כל תשובה עטופה במעטפת אחידה. שגיאות מוחזרות באותו מבנה עם{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">success: false</code>.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-xs font-medium text-green-400">תשובה תקינה</p>
            <CodeBlock className="h-full">{`{
  "success": true,
  "data": { ... },
  "timestamp": "2026-06-10T12:00:00.000Z"
}`}</CodeBlock>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-xs font-medium text-red-400">שגיאה</p>
            <CodeBlock className="h-full">{`{
  "success": false,
  "statusCode": 404,
  "message": "Product not found",
  "timestamp": "2026-06-10T12:00:00.000Z"
}`}</CodeBlock>
          </div>
        </div>
      </section>

      {/* Rate limits */}
      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">מגבלות קצב וגישה</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            התחילו בחינם, שדרגו כשתצטרכו יותר.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Free tier */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-muted-foreground" />
              <span className="font-semibold">ללא הרשמה</span>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                20 בקשות / 60 שניות
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                כל נקודות הקצה זמינות
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                ללא אימות
              </li>
            </ul>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-zinc-400">curl</p>
              <CodeBlock>{`curl "https://api.priceil.dev/stores"`}</CodeBlock>
              <p className="text-xs font-mono text-zinc-400">JavaScript</p>
              <CodeBlock>{`const res = await fetch("https://api.priceil.dev/stores");
const { data } = await res.json();`}</CodeBlock>
              <p className="text-xs font-mono text-zinc-400">Python</p>
              <CodeBlock>{`import httpx
data = httpx.get("https://api.priceil.dev/stores").json()["data"]`}</CodeBlock>
              <p className="text-xs font-mono text-zinc-400">Rust</p>
              <CodeBlock>{`let data = reqwest::get("https://api.priceil.dev/stores")
    .await?.json::<serde_json::Value>().await?;
let data = &data["data"];`}</CodeBlock>
            </div>
          </div>

          {/* API key tier */}
          <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5 ring-1 ring-primary/20">
            <div className="flex items-center gap-2">
              <Key className="size-4 text-primary" />
              <span className="font-semibold">אחרי הרשמה</span>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                500 בקשות / 60 שניות
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                כל נקודות הקצה זמינות
              </li>
              <li className="flex items-center gap-2">
                <Lock className="size-3.5 shrink-0 text-primary" />
                שלחו את המפתח בכל בקשה
              </li>
            </ul>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-zinc-400">curl</p>
              <CodeBlock>{`curl -H "x-api-key: YOUR_KEY" \
  "https://api.priceil.dev/products?q=לחם"`}</CodeBlock>
              <p className="text-xs font-mono text-zinc-400">JavaScript</p>
              <CodeBlock>{`const res = await fetch(
  "https://api.priceil.dev/products?q=לחם",
  { headers: { "x-api-key": "YOUR_KEY" } }
);
const { data } = await res.json();`}</CodeBlock>
              <p className="text-xs font-mono text-zinc-400">Python</p>
              <CodeBlock>{`import httpx
data = httpx.get(
  "https://api.priceil.dev/products",
  params={"q": "לחם"},
  headers={"x-api-key": "YOUR_KEY"},
).json()["data"]`}</CodeBlock>
              <p className="text-xs font-mono text-zinc-400">Rust</p>
              <CodeBlock>{`let data = reqwest::Client::new()
    .get("https://api.priceil.dev/products?q=לחם")
    .header("x-api-key", "YOUR_KEY")
    .send().await?.json::<serde_json::Value>().await?;
let data = &data["data"];`}</CodeBlock>
            </div>
          </div>
        </div>
      </section>

      {/* Sign-up CTA */}
      <section className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          מגיעים ל-20 הבקשות מהר מדי?{" "}
          <span className="text-foreground font-medium">חשבון חינמי נותן לכם 500 בקשות לדקה</span>{" "}
          — מספיק לכל אפליקציה, בוט או סקריפט.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {!user && (
            <LoginButton size="lg" className="gap-2">
              <Key className="size-3.5" />
              צור חשבון עכשיו
            </LoginButton>
          )}
          <Button size="lg" className="gap-2" variant="outline">
            <Book className="size-3.5" />
            <Link href="/developers/docs">
              שימוש ב - API
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
}
