"use client";

import { useState } from "react";
import { Play, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_DISPLAY_BASE = "https://api.priceil.dev";

const EXAMPLES = [
    { label: "חיפוש מוצר", path: "/products", params: "q=חלב&limit=5" },
    { label: "רשימת חנויות", path: "/stores", params: "limit=5" },
    { label: "רשתות חנויות", path: "/stores/chains", params: "" },
    { label: "מחירי ברקוד", path: "/products/7290000000001/prices", params: "" },
];

export function ApiPlayground() {
    const [selectedExample, setSelectedExample] = useState(0);
    const [path, setPath] = useState(EXAMPLES[0].path);
    const [params, setParams] = useState(EXAMPLES[0].params);
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [httpStatus, setHttpStatus] = useState<number | null>(null);
    const [shellTab, setShellTab] = useState<"curl" | "powershell">("curl");
    const [copied, setCopied] = useState(false);
    const [copiedResponse, setCopiedResponse] = useState(false);

    function copyToClipboard() {
        const text = shellTab === "curl" ? curlCmd : powershellCmd;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function copyResponse() {
        if (!response) return;
        navigator.clipboard.writeText(response).then(() => {
            setCopiedResponse(true);
            setTimeout(() => setCopiedResponse(false), 2000);
        });
    }

    const fullUrl = `${API_DISPLAY_BASE}${path}${params ? `?${params}` : ""}`;
    const proxyUrl = `/api/proxy?path=${encodeURIComponent(path)}&qs=${encodeURIComponent(params)}`;

    function selectExample(i: number) {
        setSelectedExample(i);
        setPath(EXAMPLES[i].path);
        setParams(EXAMPLES[i].params);
        setResponse(null);
        setHttpStatus(null);
    }

    async function sendRequest() {
        setLoading(true);
        setResponse(null);
        setHttpStatus(null);
        try {
            const res = await fetch(proxyUrl);
            setHttpStatus(res.status);
            const json = await res.json();
            setResponse(JSON.stringify(json, null, 2));
        } catch {
            setResponse("שגיאה: לא ניתן להתחבר ל-API.");
            setHttpStatus(0);
        } finally {
            setLoading(false);
        }
    }

    const curlCmd = `curl "${fullUrl}"`;
    const powershellCmd = `Invoke-RestMethod -Uri "${fullUrl}" | ConvertTo-Json -Depth 10`;

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

            {/* URL bar */}
            <div className="flex items-stretch gap-2">
                <Button
                    onClick={sendRequest}
                    disabled={loading}
                    size="lg"
                    className="shrink-0 gap-2 cursor-pointer"
                >
                    {loading
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Play className="size-3.5" />
                    }
                    שלח
                </Button>
                <div
                    dir="ltr"
                    className="flex flex-1 items-center overflow-hidden rounded-xl border border-border bg-zinc-950 font-mono text-xs"
                >
                    <span className="shrink-0 border-r border-zinc-800 bg-zinc-900 px-3 py-2.5 text-zinc-400">
                        GET
                    </span>
                    <input
                        dir="ltr"
                        value={path}
                        onChange={(e) => { setPath(e.target.value); setResponse(null); setHttpStatus(null); }}
                        className="min-w-0 shrink bg-transparent px-2 py-2.5 text-zinc-300 outline-none"
                        placeholder="/products"
                        spellCheck={false}
                    />
                    <span className="shrink-0 text-zinc-600">?</span>
                    <input
                        dir="ltr"
                        value={params}
                        onChange={(e) => { setParams(e.target.value); setResponse(null); setHttpStatus(null); }}
                        className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-zinc-400 outline-none"
                        placeholder="q=חלב&limit=5"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* Response */}
            {(response !== null || loading) && (
                <div className="flex flex-col gap-2">
                    {httpStatus !== null && (
                        <div className="flex items-center justify-between">
                            <button
                                onClick={copyResponse}
                                className="flex gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                                title="העתק תגובה"
                            >
                                {copiedResponse ? (
                                    <><Check className="size-3 text-green-500" /> הועתק</>
                                ) : (
                                    <><Copy className="size-3" /> העתק</>
                                )}
                            </button>

                            <div className="flex items-center gap-2" dir="ltr">
                                <span
                                    className={cn(
                                        "rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold",
                                        httpStatus >= 200 && httpStatus < 300
                                            ? "bg-green-500/10 text-green-400"
                                            : "bg-red-500/10 text-red-400"
                                    )}
                                >
                                    {httpStatus === 0 ? "ERR" : httpStatus}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">{fullUrl}</span>
                            </div>
                        </div>
                    )}
                    {loading ? (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-500">
                            טוען...
                        </div>
                    ) : (
                        <pre
                            dir="ltr"
                            className="max-h-72 overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-left font-mono text-xs leading-6 text-zinc-300"
                        >
                            {response}
                        </pre>
                    )}
                </div>
            )}

            {/* Shell commands */}
            <div className="flex flex-col gap-0">
                <div className="flex justify-between items-center ">
                    <button
                        onClick={copyToClipboard}
                        className="flex gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                        title="העתק"
                    >
                        {copied ? (
                            <><Check className="size-3 text-green-500" /> הועתק</>
                        ) : (
                            <><Copy className="size-3" /> העתק</>
                        )}
                    </button>

                    <div className="flex items-center gap-1 border-b border-border" dir="ltr">
                        {(["curl", "powershell"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setShellTab(tab)}
                                className={cn(
                                    "-mb-px border-b-2 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                                    shellTab === tab
                                        ? "border-primary text-foreground"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab === "curl" ? "Linux / macOS" : "Windows (PowerShell)"}
                            </button>
                        ))}
                    </div>
                </div>
                <pre
                    dir="ltr"
                    suppressHydrationWarning
                    className="overflow-x-auto rounded-b-xl rounded-t-none border border-t-0 border-zinc-800 bg-zinc-950 p-4 text-left font-mono text-xs leading-6 text-zinc-300"
                >
                    {shellTab === "curl" ? curlCmd : powershellCmd}
                </pre>
            </div>

        </div>
    );
}
