"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Token = { text: string; className?: string };

const TOKEN_RE = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:]/g;

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of source.matchAll(TOKEN_RE)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ text: source.slice(last, index) });
    if (match[1] !== undefined) {
      tokens.push({ text: match[1], className: match[2] ? "text-[#7ee787]" : "text-[#a5d6ff]" });
      if (match[2]) tokens.push({ text: match[2], className: "text-[#8b949e]" });
    } else if (match[3] !== undefined) {
      tokens.push({ text: match[0], className: "text-[#ff7b72]" });
    } else if (/^[{}[\],:]$/.test(match[0])) {
      tokens.push({ text: match[0], className: "text-[#8b949e]" });
    } else {
      tokens.push({ text: match[0], className: "text-[#79c0ff]" });
    }
    last = index + match[0].length;
  }
  if (last < source.length) tokens.push({ text: source.slice(last) });
  return tokens;
}

const SHARED_TEXT = "m-0 whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed";

export function JsonEditor({
  value,
  onChange,
  placeholder,
  className
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const preRef = React.useRef<HTMLPreElement>(null);
  const tokens = React.useMemo(() => tokenize(value), [value]);

  function syncScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    const pre = preRef.current;
    if (!pre) return;
    pre.scrollTop = e.currentTarget.scrollTop;
    pre.scrollLeft = e.currentTarget.scrollLeft;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-slate-200 bg-[#0a0a0c] shadow-sm focus-within:ring-2 focus-within:ring-izii-green/30",
        className
      )}
    >
      <pre
        ref={preRef}
        aria-hidden
        className={cn(SHARED_TEXT, "pointer-events-none absolute inset-0 overflow-hidden text-zinc-300")}
      >
        {tokens.map((token, i) =>
          token.className ? (
            <span key={i} className={token.className}>
              {token.text}
            </span>
          ) : (
            <React.Fragment key={i}>{token.text}</React.Fragment>
          )
        )}
        {"\n"}
      </pre>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className={cn(
          SHARED_TEXT,
          "relative block min-h-[140px] w-full resize-y bg-transparent text-transparent caret-zinc-200 outline-none",
          "placeholder:text-zinc-600 selection:bg-izii-lime/30 selection:text-transparent"
        )}
      />
    </div>
  );
}
