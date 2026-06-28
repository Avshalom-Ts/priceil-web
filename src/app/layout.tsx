import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Footer } from "@/components/footbar";
import { CookieBanner } from "@/components/cookie-banner";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "PriceIL",
    template: "%s | PriceIL",
  },
  description:
    "פלטפורמה פתוחה לחיפוש והשוואת מחירי מוצרים בין רשתות הסופרמרקט בישראל.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${rubik.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          <Navbar />
          {children}
          <Footer />
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
