"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginButton } from "@/components/login-button";
import { createClient } from "@/lib/supabase/client";

const SUBJECT_MAX_LENGTH = 150;
const CONTENT_MAX_LENGTH = 4000;

function getDisplayName(user: User): string {
    return (
        (typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : undefined) ||
        (typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : undefined) ||
        user.email?.split("@")[0] ||
        "משתמש"
    );
}

export default function ContactPage() {
    const [formData, setFormData] = useState({
        subject: "",
        content: "",
    });
    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user ?? null);
            setLoadingUser(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!user) {
            setErrorMessage("יש להתחבר כדי לשלוח הודעה.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/contact/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: formData.subject,
                    content: formData.content,
                }),
            });

            const body = (await response.json()) as { error?: string };
            if (!response.ok) {
                setErrorMessage(body.error ?? "שליחת ההודעה נכשלה. נסו שוב.");
                return;
            }

            setSuccessMessage("תודה על הפנייה! נחזור אליכם בקרוב.");
            setFormData({ subject: "", content: "" });
        } catch (error) {
            console.error("Error submitting form:", error);
            setErrorMessage("שליחת ההודעה נכשלה. נסו שוב.");
        } finally {
            setIsLoading(false);
        }
    }

    const displayName = user ? getDisplayName(user) : "";
    const email = user?.email ?? "";

    return (
        <div className="flex flex-col gap-14 container mx-auto px-4 py-16 max-w-2xl">
            <header className="flex flex-col gap-5">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                        צור קשר אתנו
                    </h1>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                        יש לכם שאלה על ה-API? נתקלתם בבעיה? או רוצים להציע משהו? אנחנו כאן
                        כדי לעזור.
                    </p>
                </div>
            </header>

            <div className="flex flex-col gap-8">

                {/* Contact form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">שם מלא</label>
                        <Input
                            type="text"
                            placeholder="השם שלך"
                            value={displayName}
                            readOnly
                            required
                            disabled={isLoading || loadingUser || !user}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            דוא&quot;ל
                        </label>
                        <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            readOnly
                            required
                            disabled={isLoading || loadingUser || !user}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">נושא</label>
                        <Input
                            type="text"
                            placeholder="נושא ההודעה"
                            value={formData.subject}
                            onChange={(e) =>
                                setFormData({ ...formData, subject: e.target.value })
                            }
                            maxLength={SUBJECT_MAX_LENGTH}
                            required
                            disabled={isLoading || loadingUser || !user}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            {formData.subject.length}/{SUBJECT_MAX_LENGTH}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">הודעה</label>
                        <textarea
                            placeholder="כתבו את הודעתכם כאן..."
                            value={formData.content}
                            onChange={(e) =>
                                setFormData({ ...formData, content: e.target.value })
                            }
                            required
                            maxLength={CONTENT_MAX_LENGTH}
                            disabled={isLoading || loadingUser || !user}
                            rows={6}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            {formData.content.length}/{CONTENT_MAX_LENGTH}
                        </p>
                    </div>

                    {!loadingUser && !user ? (
                        <div className="rounded-lg border px-4 py-3 flex justify-between flex-col sm:items-center">
                            <p className="text-sm text-muted-foreground mb-3">
                                כדי לשלוח הודעה למנהלי המערכת צריך להתחבר.
                            </p>
                            <LoginButton type="button" size="sm" returnTo="/contact">התחברות עם Google</LoginButton>
                        </div>
                    ) : null}

                    {successMessage && (
                        <div className="rounded-lg bg-green-500/10 px-4 py-3 border border-green-500/20">
                            <p className="text-sm text-green-600 dark:text-green-400">
                                {successMessage}
                            </p>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="rounded-lg bg-destructive/10 px-4 py-3 border border-destructive/20">
                            <p className="text-sm text-destructive">{errorMessage}</p>
                        </div>
                    )}
                    {!loadingUser && user && (
                        <Button type="submit" disabled={isLoading || loadingUser || !user} size="lg">
                            {isLoading ? "שולח..." : "שלח הודעה"}
                        </Button>
                    )}
                </form>
            </div>
        </div>
    );
}
