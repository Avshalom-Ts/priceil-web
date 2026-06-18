"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShellTab {
  label: string;
  command: string;
}

interface ShellCommandProps {
  tabs: ShellTab[];
  defaultTab?: number;
}

export function ShellCommand({ tabs, defaultTab = 0 }: ShellCommandProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [copied, setCopied] = useState(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(tabs[activeTab].command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex justify-between items-center">
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
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={cn(
                "-mb-px border-b-2 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                activeTab === i
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <pre
        dir="ltr"
        suppressHydrationWarning
        className="overflow-x-auto rounded-b-xl rounded-t-none border border-t-0 border-zinc-800 bg-zinc-950 p-4 text-left font-mono text-xs leading-6 text-zinc-300"
      >
        {tabs[activeTab].command}
      </pre>
    </div>
  );
}
