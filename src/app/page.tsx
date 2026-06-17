import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  BarChart2,
  Search,
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
            השוואת מחירי הסופרמרקטים{" "}
            <span className="text-primary">בישראל</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            אנחנו אוספים, מנתחים ומפרסמים את נתוני המחירים ממאות סניפים ברחבי
            הארץ — בהתאם ל<a href="https://www.gov.il/he/pages/cpfta_prices_regulations" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">חוק שקיפות המחירים</a>. חפשו מוצרים, השוו מחירים בין
            רשתות ומצאו את הסל בזול ביותר.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 px-6">
              <Link href="/shopping-list">
                <Search className="size-4" />
                חפש מוצר
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          {/* Story lead */}
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-2xl font-bold tracking-tight">
              כמה שילמתם יותר מדי בקנייה האחרונה?
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              מחירי הסופרמרקטים בישראל משתנים בין רשת לרשת, בין עיר לעיר ואפילו
              בין סניף לסניף. רוב הצרכנים לא יודעים שאותו מוצר יכול לעלות 30%
              פחות בסניף הסמוך. אנחנו נותנים לכם את המידע הזה — מיד, בחינם,
              ללא הרשמה.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <Search className="mb-4 size-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">חיפוש מוצרים</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                חפשו כל מוצר לפי שם וקבלו רשימת מחירים עדכנית מכל הרשתות —
                ממוינת מהזול ליקר, ברמת הסניף.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <BarChart2 className="mb-4 size-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">השוואת מחירים</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                ראו בבת אחת כמה עולה כל מוצר בשופרסל, רמי לוי, יינות ביתן
                ועוד — בכל עיר ובכל סניף.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <ShoppingCart className="mb-4 size-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">סל קניות חכם</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                הרכיבו סל מוצרים וגלו באיזה סניף הסל כולו יעלה הכי פחות —
                חיסכון אמיתי על הקנייה השבועית.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight">
            אז איך משתמשים?
          </h2>
          <ol className="flex flex-col gap-6">
            {[
              {
                num: "01",
                title: "בחרו חנות קרובה אליכם",
                desc: "בחרו את הסניף שבו אתם בדרך כלל קונים — לפי עיר, רשת או מיקום.",
              },
              {
                num: "02",
                title: "הוסיפו מוצרים לסל",
                desc: "חפשו כל מוצר שתרצו והוסיפו אותו לסל הקניות שלכם. המחיר בסניף שבחרתם יופיע אוטומטית.",
              },
              {
                num: "03",
                title: "גלו איפה הכי זול",
                desc: "ראו את הסל שלכם מול כל הסניפים הזמינים, ומצאו איפה תשלמו הכי פחות על הכל ביחד.",
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
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="gap-2 px-8">
              <Link href="/shopping-list">
                <Search className="size-4" />
                התחילו עכשיו — זה בחינם
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-border px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border text-center">
            <div className="px-6">
              <p className="text-3xl font-extrabold tracking-tight text-primary">31</p>
              <p className="mt-1 text-sm text-muted-foreground">רשתות סופרמרקט</p>
            </div>
            <div className="px-6">
              <p className="text-3xl font-extrabold tracking-tight text-primary">1,923</p>
              <p className="mt-1 text-sm text-muted-foreground">סניפים ברחבי הארץ</p>
            </div>
            <div className="px-6">
              <p className="text-3xl font-extrabold tracking-tight text-primary">245,537</p>
              <p className="mt-1 text-sm text-muted-foreground">מוצרים במאגר</p>
            </div>
          </div>
        </div>
      </section>


    </main>
  );
}

