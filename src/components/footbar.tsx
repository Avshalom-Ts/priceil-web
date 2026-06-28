import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
            <div className="flex justify-between max-w-4xl mx-auto">
                {/* Links Section */}
                <div className="flex items-start justify-between gap-4 max-w-1/3 flex-wrap">
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
                {/* All Rights Reserved Section */}
                {/* Left side - logo */}
                <div className="flex flex-col items-end justify-between">
                    <Link href="/" className="flex items-center gap-2 justify-center">
                        <span className="text-xl font-bold tracking-tight">PriceIL</span>
                    </Link>
                    {/* <div className="mt-4"> */}
                    <p>
                        כל הזכויות שמורות ל-
                        PriceIL &copy; {new Date().getFullYear()}
                    </p>
                    {/* </div> */}
                </div>
            </div>
        </footer>
    );
}