import Link from "next/link";
import {
  ArrowLeft,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiPlayground } from "@/components/api-playground";

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

export default function DevelopersPage() {
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
              <Link href="/docs/products">
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
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5">
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
            <CodeBlock>{`curl "https://api.priceil.com/stores"`}</CodeBlock>
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
            <CodeBlock>{`curl -H "x-api-key: YOUR_KEY" "https://api.priceil.com/products?q=לחם"`}</CodeBlock>
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
          <Button size="lg" className="gap-2">
            <Key className="size-3.5" />
            <Link href="/signup">
              צור חשבון עכשיו
            </Link>
          </Button>
          <Button size="lg" className="gap-2" variant="outline">
            <Book className="size-3.5" />
            <Link href="/docs">
              שימוש ב - API
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
}
