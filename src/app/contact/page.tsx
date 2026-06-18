"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        // TODO: Replace with actual form submission endpoint
        try {
            // Simulate form submission
            await new Promise((resolve) => setTimeout(resolve, 500));
            setSubmitted(true);
            setFormData({ name: "", email: "", subject: "", message: "" });
            setTimeout(() => setSubmitted(false), 3000);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    }

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
                            placeholder="הכנס את שמך"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            דוא&quot;ל
                        </label>
                        <Input
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            required
                            disabled={isLoading}
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
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">הודעה</label>
                        <textarea
                            placeholder="כתבו את הודעתכם כאן..."
                            value={formData.message}
                            onChange={(e) =>
                                setFormData({ ...formData, message: e.target.value })
                            }
                            required
                            disabled={isLoading}
                            rows={6}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        />
                    </div>

                    {submitted && (
                        <div className="rounded-lg bg-green-500/10 px-4 py-3 border border-green-500/20">
                            <p className="text-sm text-green-600 dark:text-green-400">
                                תודה על הפנייה! נחזור אליכם בקרוב.
                            </p>
                        </div>
                    )}

                    <Button type="submit" disabled={isLoading} size="lg">
                        {isLoading ? "שולח..." : "שלח הודעה"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
