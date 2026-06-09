export default function TermsPage() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">תנאי שימוש</h1>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">1. קבלת התנאים</h2>
                    <p>
                        השימוש באתר PriceIL ובממשק ה-API מהווה הסכמה לתנאי שימוש אלה. אם אינך מסכים לתנאים, נא
                        הפסק את השימוש בשירות.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">2. תיאור השירות</h2>
                    <p>
                        PriceIL מספקת גישה לנתוני מחירי מוצרים בסופרמרקטים בישראל, בהתאם ל<a href="https://www.gov.il/he/pages/cpfta_prices_regulations" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">חוק שקיפות המחירים</a>.
                        הנתונים מסופקים כפי שהם (as-is) ואינם מהווים ייעוץ קנייה.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">3. שימוש מותר</h2>
                    <p>
                        מותר להשתמש בשירות לצרכים אישיים, מחקריים ופיתוח אפליקציות עצמאיות. השימוש חייב להיות
                        בתום לב ובהתאם למגבלות הקצב (rate limits) המפורטות בדוקומנטציה.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">4. שימוש אסור</h2>
                    <p>אסור להשתמש בשירות לצרכים הבאים:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 pr-4">
                        <li>עקיפת מגבלות הקצב או שימוש בכמות בלתי סבירה של בקשות</li>
                        <li>פעילות בלתי חוקית או פגיעה בצדדים שלישיים</li>
                        <li>הצגת הנתונים כמקוריים ללא ציון המקור</li>
                        <li>פעולות שעלולות לפגוע בזמינות השירות</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">5. דיוק הנתונים</h2>
                    <p>
                        אנו משתדלים לספק נתונים מדויקים ועדכניים, אך לא ניתן להבטיח דיוק מלא בכל עת. יש לבדוק
                        מחירים ישירות בחנות לפני ביצוע רכישה.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">6. הגבלת אחריות</h2>
                    <p>
                        PriceIL אינה אחראית לנזקים ישירים או עקיפים הנובעים מהסתמכות על הנתונים המוצגים בשירות,
                        לרבות שינויי מחירים, טעויות בנתונים, או הפסקות שירות.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">7. קניין רוחני</h2>
                    <p>
                        עיצוב האתר, הקוד והתוכן המקורי הם רכוש PriceIL. נתוני המחירים עצמם מקורם ברשתות השיווק
                        בהתאם ל<a href="https://www.gov.il/he/pages/cpfta_prices_regulations" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">חוק שקיפות המחירים</a>.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">8. שינויים בתנאים</h2>
                    <p>
                        תנאי שימוש אלה עשויים להשתנות. המשך השימוש בשירות לאחר עדכון התנאים מהווה הסכמה לתנאים
                        המעודכנים.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">9. דין חל</h2>
                    <p>
                        תנאי שימוש אלה כפופים לדין הישראלי. סמכות השיפוט הבלעדית תהא לבתי המשפט המוסמכים בישראל.
                    </p>
                </div>
            </section>
        </main>
    );
}
