import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-border px-4 py-8 text-xs text-muted-foreground">
            <div className="mx-auto max-w-4xl flex flex-col gap-8 sm:flex-row sm:justify-between">
                {/* Links Section */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-start">
                    <Link href="/privacy" className="hover:text-foreground transition-colors">
                        חוק הפרטיות
                    </Link>
                    <Link href="/terms" className="hover:text-foreground transition-colors">
                        תנאי שימוש
                    </Link>
                    <Link href="/developers" className="hover:text-foreground transition-colors">
                        API למפתחים
                    </Link>
                    <Link href="/developers/docs" className="hover:text-foreground transition-colors">
                        השימוש ב - API
                    </Link>
                    <Link href="/developers/plans" className="hover:text-foreground transition-colors">
                        תוכניות ומחירים
                    </Link>
                    <Link href="/contact" className="hover:text-foreground transition-colors">
                        צור קשר
                    </Link>
                </div>
                {/* Logo + copyright */}
                <div className="flex flex-col items-center gap-1 sm:items-end">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-bold tracking-tight">PriceIL</span>
                    </Link>
                    <p>
                        כל הזכויות שמורות ל-
                        PriceIL &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </footer>
    );
}