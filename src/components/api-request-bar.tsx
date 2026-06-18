"use client";

import { useState } from "react";
import { Play, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApiRequestBarProps {
    initialPath?: string;
    initialParams?: string;
    placeholderParams?: string;
    requestMethod?: "GET" | "POST";
    initialBody?: string;
    placeholderBody?: string;
}

export function ApiRequestBar({
    initialPath = "/products",
    initialParams = "",
    placeholderParams = "",
    requestMethod = "GET",
    initialBody = "",
    placeholderBody = ""
}: ApiRequestBarProps) {
    const [path, setPath] = useState(initialPath);
    const [params, setParams] = useState(initialParams);
    const [body, setBody] = useState(initialBody);
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [httpStatus, setHttpStatus] = useState<number | null>(null);
    const [copiedResponse, setCopiedResponse] = useState(false);
    const showParamsInput = requestMethod === "GET" && Boolean(placeholderParams || params);
    const showBodyInput = requestMethod === "POST";

    const fullUrl = `https://api.priceil.dev${path}${params ? `?${params}` : ""}`;
    const proxyUrl = `/api/proxy?path=${encodeURIComponent(path)}&qs=${encodeURIComponent(params)}`;

    function reset() {
        setResponse(null);
        setHttpStatus(null);
    }

    function copyResponse() {
        if (!response) return;
        navigator.clipboard.writeText(response).then(() => {
            setCopiedResponse(true);
            setTimeout(() => setCopiedResponse(false), 2000);
        });
    }

    async function sendRequest() {
        setLoading(true);
        setResponse(null);
        setHttpStatus(null);

        try {
            let res: Response;

            if (requestMethod === "POST") {
                let parsedBody: unknown = {};

                if (body.trim()) {
                    try {
                        parsedBody = JSON.parse(body);
                    } catch {
                        setResponse("שגיאה: גוף הבקשה חייב להיות JSON תקין.");
                        setHttpStatus(0);
                        return;
                    }
                }

                res = await fetch(proxyUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ body: parsedBody }),
                });
            } else {
                res = await fetch(proxyUrl);
            }

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

    return (
        <div className="flex flex-col gap-3">
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
                        {requestMethod}
                    </span>
                    <input
                        dir="ltr"
                        value={path}
                        onChange={(e) => { setPath(e.target.value); reset(); }}
                        className={cn(
                            "min-w-0 bg-transparent px-2 py-2.5 text-zinc-300 outline-none",
                            showParamsInput
                                ? "min-w-[10ch] max-w-[70%] shrink-0"
                                : "flex-1"
                        )}
                        style={showParamsInput ? { width: `${Math.max(path.length + 2, 14)}ch` } : undefined}
                        placeholder="/products"
                        spellCheck={false}
                    />
                    {showParamsInput &&
                        <span className="shrink-0 text-zinc-600">?</span>}
                    {showParamsInput && (
                        <input
                            dir="ltr"
                            value={params}
                            onChange={(e) => { setParams(e.target.value); reset(); }}
                            className="min-w-0 w-0 flex-1 bg-transparent px-1 py-2.5 text-zinc-400 outline-none"
                            placeholder={placeholderParams}
                            spellCheck={false}
                        />
                    )}
                </div>
            </div>

            {showBodyInput && (
                <div className="overflow-hidden rounded-xl border border-border bg-zinc-950">
                    <div className="border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-400">
                        JSON Body
                    </div>
                    <textarea
                        dir="ltr"
                        value={body}
                        onChange={(e) => { setBody(e.target.value); reset(); }}
                        className="h-40 w-full resize-y bg-transparent p-3 font-mono text-xs leading-6 text-zinc-300 outline-none"
                        placeholder={placeholderBody}
                        spellCheck={false}
                    />
                </div>
            )}

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
        </div>
    );
}
