export default function PrivacyPage() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">מדיניות פרטיות</h1>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">1. כללי</h2>
                    <p>
                        PriceIL מכבדת את פרטיות המשתמשים שלה. מדיניות פרטיות זו מתארת אילו נתונים נאספים, כיצד הם
                        משמשים ואיך הם מוגנים בעת השימוש באתר ובממשק ה-API.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">2. נתונים הנאספים</h2>
                    <p>
                        אנו עשויים לאסוף נתונים טכניים בלבד כגון כתובת IP, סוג הדפדפן וסטטיסטיקות שימוש אנונימיות,
                        לצורך שיפור השירות. איננו אוספים שמות, כתובות דואר אלקטרוני, או מידע אישי מזהה ללא הסכמה
                        מפורשת.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">3. שימוש בנתונים</h2>
                    <p>
                        הנתונים הטכניים נאספים אך ורק לצורך ניטור תקינות השירות, זיהוי תקלות ושיפור ביצועים. איננו
                        מוכרים, משתפים, או מעבירים מידע לצדדים שלישיים לצורכי פרסום.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">4. עוגיות (Cookies)</h2>
                    <p>
                        האתר עשוי להשתמש בעוגיות טכניות הכרחיות לתפקוד תקין (כגון שמירת העדפת ערכת צבעים). לא
                        נעשה שימוש בעוגיות מעקב או פרסום.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">5. אבטחת מידע</h2>
                    <p>
                        אנו נוקטים אמצעים סבירים להגנה על המידע הנאסף. עם זאת, אין אפשרות להבטיח אבטחה מוחלטת של
                        מידע המועבר באינטרנט.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">6. שינויים במדיניות</h2>
                    <p>
                        מדיניות זו עשויה להתעדכן מעת לעת. שימוש מתמשך בשירות לאחר פרסום שינויים מהווה הסכמה
                        למדיניות המעודכנת.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">7. יצירת קשר</h2>
                    <p>
                        לשאלות בנוגע למדיניות פרטיות זו ניתן לפנות אלינו דרך עמוד{" "}
                        <a href="/contact" className="text-primary hover:underline">
                            צור קשר
                        </a>
                        .
                    </p>
                </div>
            </section>
        </main>
    );
}
