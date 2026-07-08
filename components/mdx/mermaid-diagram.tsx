"use client";

import * as React from "react";
import type { Mermaid } from "mermaid";
import { cn } from "@/lib/utils";
import { MDS } from "@/config/brand";

let mermaidPromise: Promise<Mermaid> | null = null;

// Carrega o mermaid só no browser (dynamic import) para evitar avaliação no SSR.
async function loadMermaid(): Promise<Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: {
          primaryColor: "#e8f6fd",
          primaryTextColor: MDS.navy,
          primaryBorderColor: MDS.blue,
          lineColor: "#94a3b8",
          secondaryColor: "#f1f5f9",
          tertiaryColor: "#f8fafc",
          background: "#ffffff",
          mainBkg: "#e8f6fd",
          nodeBorder: MDS.blue,
          clusterBkg: "#f8fafc",
          titleColor: MDS.navy,
          edgeLabelBackground: "#ffffff"
        },
        fontFamily: '"Elms Sans", system-ui, sans-serif'
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

export function MermaidDiagram({ chart, className }: { chart: string; className?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const renderId = React.useId().replace(/:/g, "");

  React.useEffect(() => {
    const source = chart.trim();
    if (!source) return;

    let cancelled = false;
    const el: HTMLDivElement | null = containerRef.current;
    if (!el) return;
    const node = el;

    async function render() {
      setError(null);
      node.innerHTML = "";

      try {
        const mermaid = await loadMermaid();
        if (cancelled) return;
        const { svg, bindFunctions } = await mermaid.render(`mermaid-${renderId}`, source);
        if (cancelled) return;
        node.innerHTML = svg;
        bindFunctions?.(node);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Falha ao renderizar diagrama Mermaid.");
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [chart, renderId]);

  if (error) {
    return (
      <div
        className={cn(
          "my-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300",
          className
        )}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mermaid-diagram my-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-6",
        "[&_svg]:mx-auto [&_svg]:max-w-full",
        className
      )}
    >
      <div ref={containerRef} aria-label="Diagrama Mermaid" />
    </div>
  );
}
