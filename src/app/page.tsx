import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  BarChart2,
  Database,
  Search,
  ArrowLeft,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 to-background px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Zap className="size-3 text-primary" />
            נתונים עדכניים מכל הרשתות הגדולות בישראל
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            השוו מחירי סופרמרקט{" "}
            <span className="text-primary">בכל ישראל</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            PriceIL אוספת, מנתחת ומפרסמת נתוני מחירים ממאות סניפים ברחבי
            הארץ — בהתאם לחוק שקיפות המחירים. חפשו מוצרים, השוו מחירים בין
            רשתות ומצאו את העסקה הטובה ביותר.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 px-6">
              <Link href="/search">
                <Search className="size-4" />
                חפש מוצר
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 px-6">
              <Link href="/docs">
                תיעוד ה-API
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight">
            מה אפשר לעשות עם PriceIL?
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <Search className="mb-4 size-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">חיפוש מוצרים</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                חפשו כל מוצר לפי שם וקבלו רשימת מחירים עדכנית מכל הרשתות —
                ממוינת מהזול ליקר.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <BarChart2 className="mb-4 size-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">השוואת מחירים</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                ראו בבת אחת כמה עולה כל מוצר בשופרסל, רמי לוי, יינות ביתן,
                ועוד — בכל עיר ובכל סניף.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <Database className="mb-4 size-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">API פתוח למפתחים</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                REST API מלא עם תיעוד מפורט. מושלם לבניית אפליקציות לחיסכון,
                מחקר כלכלי ונתונים פתוחים.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight">
            איך זה עובד?
          </h2>
          <ol className="flex flex-col gap-6">
            {[
              {
                num: "01",
                title: "הרשתות מפרסמות קבצי מחירים",
                desc: 'לפי חוק שקיפות מחירים בסופרמרקטים, כל הרשתות הגדולות מחויבות לפרסם קבצי מחירים עדכניים ברשת.',
              },
              {
                num: "02",
                title: "אנחנו אוספים ומנתחים",
                desc: "מערכת האיסוף שלנו מורידה, מפענחת ומנרמלת את הקבצים וטוענת אותם למסד נתונים מרכזי.",
              },
              {
                num: "03",
                title: "הנתונים זמינים דרך ה-API",
                desc: "ה-API חושף את כל הנתונים — מחיר לפי מוצר, סניף, רשת ועיר — בפורמט JSON אחיד וקל לשימוש.",
              },
            ].map(({ num, title, desc }) => (
              <li key={num} className="flex items-start gap-5">
                <span className="mt-0.5 shrink-0 text-3xl font-bold tabular-nums text-primary/30">
                  {num}
                </span>
                <div>
                  <h3 className="mb-1 font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* API Preview */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold tracking-tight">
            מתחילים בדקה
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            ה-API פתוח לחלוטין — ללא הרשמה. הגבלה של 20 בקשות לדקה בחינם.
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-zinc-950 text-sm">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
              <span className="size-3 rounded-full bg-red-500/70" />
              <span className="size-3 rounded-full bg-yellow-500/70" />
              <span className="size-3 rounded-full bg-green-500/70" />
              <span className="mr-2 text-xs text-white/40 font-mono">
                example requests
              </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 text-zinc-300">
              <code>{`# חיפוש מוצר לפי שם
GET /products?q=חלב&page=1&limit=10

# מחירי מוצר ספציפי בכל הסניפים
GET /products/7290000000001/prices

# חיפוש חנויות לפי עיר
GET /stores?city=תל+אביב

# כל הרשתות הזמינות
GET /stores/chains`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/30 px-4 py-16 text-center">
        <div className="mx-auto max-w-xl">
          <ShoppingCart className="mx-auto mb-4 size-10 text-primary" />
          <h2 className="mb-3 text-2xl font-bold tracking-tight">
            מוכנים לחסוך?
          </h2>
          <p className="mb-7 text-muted-foreground">
            חפשו מוצר עכשיו וגלו כמה תוכלו לחסוך על קניות השבוע.
          </p>
          <Button asChild size="lg" className="gap-2 px-8">
            <Link href="/search">
              <Search className="size-4" />
              התחל חיפוש
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        <p>
          PriceIL &copy; {new Date().getFullYear()} — נתונים על פי{" "}
          <span className="font-medium text-foreground">
            חוק שקיפות מחירים בסופרמרקטים
          </span>
        </p>
      </footer>
    </main>
  );
}

