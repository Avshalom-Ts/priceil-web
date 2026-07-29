"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes@0.4.6 renders an inline <script> for flash-of-wrong-theme
// prevention, which triggers a false-positive React 19 dev warning on
// Next.js 16.2+. The script still executes correctly during SSR/hydration.
// This is an open upstream bug with no released fix yet:
// https://github.com/pacocoursey/next-themes/issues/385
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
        if (
            typeof args[0] === "string" &&
            args[0].includes("Encountered a script tag while rendering")
        ) {
            return;
        }
        originalError(...args);
    };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            scriptProps={{ "data-cfasync": "false" }}
        >
            {children}
        </NextThemesProvider>
    );
}
