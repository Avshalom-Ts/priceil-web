"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils"

export function CodeBlock({ children, className }: { children: string; className?: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(children).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="relative group flex flex-col min-w-0">
            <pre
                dir="ltr"
                className={cn("flex-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-left font-mono text-xs leading-6 text-zinc-300", className)}
            >
                {children}
            </pre>
            <button
                onClick={handleCopy}
                aria-label="Copy code"
                className="absolute top-2 right-2 flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:border-zinc-500 hover:text-zinc-200 cursor-pointer"
            >
                {copied ? (
                    <Check className="size-3.5 text-green-400" />
                ) : (
                    <Copy className="size-3.5" />
                )}
            </button>
        </div>
    );
}
