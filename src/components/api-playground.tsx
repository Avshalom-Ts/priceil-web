"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ShellCommand } from "@/components/shell-command";
import { ApiRequestBar } from "@/components/api-request-bar";

const EXAMPLES = [
    { label: "חיפוש מוצר", path: "/products", params: "q=חלב&limit=5" },
    { label: "סניף ברשת", path: "/stores", params: "limit=5" },
    { label: "שם רשת", path: "/stores/chains", params: "" },
    { label: "מחירי ברקוד", path: "/products/7290000000001/prices", params: "" },
];

export function ApiPlayground() {
    const [selectedExample, setSelectedExample] = useState(0);
    const [path, setPath] = useState(EXAMPLES[0].path);
    const [params, setParams] = useState(EXAMPLES[0].params);

    function selectExample(i: number) {
        setSelectedExample(i);
        setPath(EXAMPLES[i].path);
        setParams(EXAMPLES[i].params);
    }

    const curlCmd = `curl "https://api.priceil.dev${path}${params ? `?${params}` : ""}"`;
    const powershellCmd = `Invoke-RestMethod -Uri "https://api.priceil.dev${path}${params ? `?${params}` : ""}" | ConvertTo-Json -Depth 10`;

    return (
        <div className="flex flex-col gap-4">

            {/* Example chips */}
            <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex, i) => (
                    <button
                        key={ex.label}
                        onClick={() => selectExample(i)}
                        className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                            selectedExample === i
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        )}
                    >
                        {ex.label}
                    </button>
                ))}
            </div>

            {/* URL bar + Response */}
            <ApiRequestBar initialPath={path} initialParams={params} />

            {/* Shell commands */}
            <ShellCommand
                tabs={[
                    { label: "Linux / macOS", command: curlCmd },
                    { label: "Windows (PowerShell)", command: powershellCmd },
                ]}
            />

        </div>
    );
}
