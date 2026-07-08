"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const LINE_CLASS = "h-5 font-mono text-[11px] leading-5";

const LANGUAGE_LABELS: Record<string, string> = {
  curl: "bash",
  javascript: "javascript",
  python: "python",
  bash: "bash"
};

const CODE_SURFACE = "bg-[#0a0a0c]";

type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  /**
   * Wrap long lines instead of scrolling horizontally.
   * When true, line numbers are hidden to keep content aligned.
   */
  wrap?: boolean;
};

export function CodeBlock({
  code,
  language = "bash",
  className,
  showLineNumbers = true,
  collapsible = true,
  defaultExpanded = true,
  wrap = false
}: CodeBlockProps) {
  const displayLineNumbers = showLineNumbers && !wrap;
  const [highlighted, setHighlighted] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const lines = React.useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);
  const displayLang = LANGUAGE_LABELS[language] ?? language;
  const highlightLang = language === "curl" ? "bash" : language;

  React.useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded, language, code]);

  React.useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki");
        const html = await codeToHtml(code, {
          lang: highlightLang,
          theme: "github-dark"
        });
        if (!cancelled) setHighlighted(html);
      } catch {
        if (!cancelled) setHighlighted(null);
      }
    }

    void highlight();
    return () => {
      cancelled = true;
    };
  }, [code, highlightLang]);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const isOpen = collapsible ? expanded : true;

  return (
    <div
      className={cn(
        "isolate overflow-hidden rounded-lg border border-zinc-800/80",
        CODE_SURFACE,
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 bg-zinc-900/60 px-2 py-1.5",
          isOpen ? "border-b border-zinc-800/90" : "rounded-b-lg"
        )}
      >
        <button
          type="button"
          onClick={() => collapsible && setExpanded((v) => !v)}
          disabled={!collapsible}
          aria-expanded={isOpen}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition",
            collapsible && "hover:bg-zinc-800/60",
            !collapsible && "cursor-default"
          )}
        >
          {collapsible ? (
            isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
            )
          ) : null}
          <span className="truncate font-mono text-xs lowercase text-zinc-500">{displayLang}</span>
          {collapsible ? (
            <span className="ml-1 hidden text-[10px] text-zinc-600 sm:inline">
              {isOpen ? "Fechar" : "Expandir"}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={(e) => void handleCopy(e)}
          aria-label={copied ? "Código copiado" : "Copiar código"}
          title={copied ? "Copiado!" : "Copiar código"}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700/90 bg-zinc-800/90 text-zinc-400 transition",
            "hover:border-zinc-600 hover:bg-zinc-700 hover:text-zinc-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-izii-lime/40",
            copied && "border-emerald-500/40 text-emerald-400"
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="code-body"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "max-h-[min(420px,50vh)] overflow-auto overscroll-contain rounded-b-lg",
                CODE_SURFACE
              )}
            >
              <div
                className={cn(
                  "flex py-3 pl-1 pr-3",
                  wrap ? "w-full" : "min-w-max"
                )}
              >
                {displayLineNumbers ? (
                  <div
                    className={cn(
                      "shrink-0 select-none border-r border-zinc-800/80 py-0 pl-3 pr-3 text-right",
                      CODE_SURFACE
                    )}
                    aria-hidden
                  >
                    {lines.map((_, index) => (
                      <div key={index} className={cn(LINE_CLASS, "text-zinc-600 tabular-nums")}>
                        {index + 1}
                      </div>
                    ))}
                  </div>
                ) : null}

                {highlighted ? (
                  <div
                    className={cn(
                      "min-w-0 flex-1 pl-3",
                      "[&_pre]:!m-0 [&_pre]:!overflow-hidden [&_pre]:!rounded-none [&_pre]:!bg-transparent [&_pre]:!p-0",
                      "[&_code]:!block [&_code]:!rounded-none [&_code]:!bg-transparent",
                      "[&_code]:font-mono [&_code]:text-[11px] [&_code]:leading-5",
                      "[&_.line]:!bg-transparent",
                      wrap && [
                        "[&_pre]:!whitespace-pre-wrap [&_pre]:!break-all",
                        "[&_code]:!whitespace-pre-wrap [&_code]:!break-all",
                        "[&_.line]:!whitespace-pre-wrap [&_.line]:!break-all"
                      ]
                    )}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                  />
                ) : (
                  <pre className={cn("min-w-0 flex-1 pl-3", LINE_CLASS, "text-zinc-300")}>
                    <code className="block bg-transparent">
                      {lines.map((line, index) => (
                        <span
                          key={index}
                          className={cn("block", wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre")}
                        >
                          {line || " "}
                        </span>
                      ))}
                    </code>
                  </pre>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
