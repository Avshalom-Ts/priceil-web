"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "priceil-cookie-consent";

export function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setVisible(true);
        }
    }, []);

    function accept() {
        localStorage.setItem(STORAGE_KEY, "accepted");
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-4 shadow-lg">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Cookie className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        העוגיות שלנו לא נמצאות במדף — הן עוזרות לנו לשפר את החוויה שלך ולחסוך לך בסל הקניות הבא.{" "}
                        <Link
                            href="/privacy"
                            className="underline underline-offset-4 hover:text-foreground transition-colors"
                        >
                            מדיניות הפרטיות
                        </Link>
                    </p>
                </div>
                <Button onClick={accept} size="sm" className="shrink-0">
                    אוקיי, הבנתי
                </Button>
            </div>
        </div>
    );
}
