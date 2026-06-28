import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginButton } from "@/components/login-button";
import { Key } from "lucide-react";

// ── Tier data ────────────────────────────────────────────────────────────────

const TIERS = [
    {
        id: "free",
        name: "חינם",
        price: "₪0",
        priceNote: "/ חודש",
        desc: "לפרויקטים אישיים וניסיון ראשוני עם ה-API",
        features: [
            "אפליקציה אחת",
            "מפתח API אחד לאפליקציה",
            "5,000 בקשות לחודש",
        ],
        available: true,
    },
    {
        id: "basic",
        name: "בסיסי",
        price: "—",
        priceNote: "",
        desc: "לאפליקציות קטנות עם מספר קהלים",
        features: [
            "3 אפליקציות",
            "2 מפתחות לאפליקציה",
            "50,000 בקשות לחודש",
        ],
        available: false,
    },
    {
        id: "premium",
        name: "פרמיום",
        price: "—",
        priceNote: "",
        desc: "לסביבות פרודקשן ללא מגבלות מיותרות",
        features: [
            "אפליקציות ללא הגבלה",
            "מפתחות ללא הגבלה לאפליקציה",
            "בקשות ללא הגבלה",
        ],
        available: false,
    },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PlansPage() {
    const [supabase] = await Promise.all([
        createSupabaseServerClient(),
    ]);
    const { data: { user } } = await supabase.auth.getUser();
    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10">

            {/* Header */}
            <header className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">תוכניות ומחירים</h1>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        המערכת נמצאת כרגע בשלב בטא. כל המשתמשים הרשומים נהנים מגישה חינמית
                        ואפשר להתחיל לבנות ממש עכשיו, ללא חיוב. התוכניות בתשלום יהיו זמינות
                        לאחר סיום שלב הבטא.
                    </p>
                </div>
            </header>

            {/* Tier cards */}
            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">תוכניות</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    {TIERS.map((tier) => (
                        <div
                            key={tier.id}
                            className={cn(
                                "flex flex-col gap-4 rounded-2xl border p-5",
                                tier.available
                                    ? "border-border bg-card"
                                    : "pointer-events-none select-none border-border/40 bg-muted/20 opacity-50"
                            )}
                        >
                            {/* Title row */}
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{tier.name}</span>
                                {!tier.available && (
                                    <Badge
                                        variant="outline"
                                        className="border-border/60 text-[10px] text-muted-foreground"
                                    >
                                        בקרוב
                                    </Badge>
                                )}
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold tracking-tight">
                                    {tier.price}
                                </span>
                                {tier.priceNote && (
                                    <span className="text-sm text-muted-foreground">
                                        {tier.priceNote}
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-xs text-muted-foreground">{tier.desc}</p>

                            <Separator />

                            {/* Features */}
                            <ul className="flex flex-col gap-2">
                                {tier.features.map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-sm">
                                        <Check className="size-3.5 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            {tier.available ? (
                                <>
                                    {!user ? (
                                        <LoginButton size="lg" className="gap-2">
                                            <Key className="size-3.5" />
                                            צור חשבון עכשיו
                                        </LoginButton>
                                    ) : (
                                        <Button asChild variant="outline" className="mt-auto w-full">
                                            <Link href="/developers/account">עבור לחשבון</Link>
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Button
                                    disabled
                                    variant="outline"
                                    className="mt-auto w-full gap-1.5"
                                >
                                    <Lock className="size-3.5" />
                                    בקרוב
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Quota model note */}
            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold">איך מדידת השימוש עובדת</h2>
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
                    <p>
                        כל בקשה שנשלחת עם{" "}
                        <code dir="ltr" className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                            x-api-key
                        </code>{" "}
                        נספרת לחשבון המשתמש, ללא קשר לאיזו אפליקציה או מפתח בוצעה ממנה.
                    </p>
                    <p>
                        בקשות ללא מפתח (אנונימיות) כפופות רק למגבלת קצב של 20 בקשות לדקה
                        ואינן נספרות במכסה החודשית.
                    </p>
                    <p>
                        חריגה ממכסת הבקשות החודשית מחזירה{" "}
                        <code dir="ltr" className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                            429 Too Many Requests
                        </code>
                        . מומלץ ליישם retry עם backoff אקספוננציאלי.
                    </p>
                </div>
            </section>

            {/* Account CTA */}
            <section>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-0.5">
                        <p className="font-medium">מוכנים להתחיל?</p>
                        <p className="text-sm text-muted-foreground">
                            צרו חשבון, רשמו אפליקציה וקבלו מפתח API ממש עכשיו — חינם בשלב הבטא.
                        </p>
                    </div>
                    {!user ? (
                        <LoginButton size="lg" className="gap-2">
                            <Key className="size-3.5" />
                            צור חשבון עכשיו
                        </LoginButton>
                    ) : (
                        <Button asChild variant="outline" className="mt-auto w-full">
                            <Link href="/developers/account">עבור לחשבון</Link>
                        </Button>
                    )}
                </div>
            </section>

        </div>
    );
}
