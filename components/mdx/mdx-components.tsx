import * as React from "react";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { MermaidDiagram } from "@/components/mdx/mermaid-diagram";
import { CodeBlock } from "@/components/code-block";
import { cn } from "@/lib/utils";

function getLanguage(className?: string): string | null {
  if (!className || typeof className !== "string") return null;
  const match = /language-([\w-]+)/.exec(className);
  return match?.[1] ?? null;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props.children !== undefined) return extractText(props.children);
  }
  return "";
}

function PreBlock({ children, ...props }: React.ComponentPropsWithoutRef<"pre">) {
  const child = React.Children.toArray(children)[0];
  if (React.isValidElement(child)) {
    const codeProps = child.props as { className?: string; children?: React.ReactNode };
    const lang = getLanguage(codeProps.className);
    const code = extractText(codeProps.children).replace(/\n$/, "");
    if (lang === "mermaid") {
      const chart = code.trim();
      if (chart) return <MermaidDiagram chart={chart} />;
    }
    if (code) {
      // Syntax highlight (shiki) via CodeBlock — mesmo componente do playground.
      return <CodeBlock code={code} language={lang ?? "text"} className="mt-4" />;
    }
  }

  return (
    <pre
      className="mt-4 overflow-x-auto rounded-xl border border-zinc-800 bg-[#0a0a0c] p-4 font-mono text-sm text-zinc-300"
      {...props}
    >
      {children}
    </pre>
  );
}

export function Mermaid({ children }: { children: string }) {
  const chart = typeof children === "string" ? children.trim() : extractText(children).trim();
  return <MermaidDiagram chart={chart} />;
}

export const mdxComponents: MDXComponents = {
  Mermaid,
  h1: (props) => <h1 className="mt-8 text-3xl font-semibold tracking-tight text-izii-charcoal" {...props} />,
  h2: (props) => <h2 className="mt-10 text-xl font-semibold text-izii-charcoal" {...props} />,
  h3: (props) => <h3 className="mt-6 text-lg font-medium text-slate-800" {...props} />,
  p: (props) => <p className="mt-4 leading-relaxed text-slate-600" {...props} />,
  ul: (props) => <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600" {...props} />,
  ol: (props) => <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-600" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: ({ href, ...props }) => {
    const isExternal = href?.startsWith("http");
    if (isExternal) {
      return <a href={href} className="text-izii-green hover:underline" target="_blank" rel="noreferrer" {...props} />;
    }
    return <Link href={href ?? "#"} className="text-izii-green hover:underline" {...props} />;
  },
  code: ({ className, children, ...props }) => {
    const lang = getLanguage(className);
    if (lang === "mermaid") {
      const chart = extractText(children).trim();
      if (chart) return <MermaidDiagram chart={chart} />;
    }
    // Bloco de código (fenced, dentro de <pre> escuro): sem pill.
    if (className) {
      return (
        <code className={cn("font-mono text-zinc-200", className)} {...props}>
          {children}
        </code>
      );
    }
    // Código inline (claro).
    return (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-izii-green" {...props}>
        {children}
      </code>
    );
  },
  pre: (props) => <PreBlock {...props} />,
  blockquote: (props) => (
    <blockquote className="mt-4 rounded-r-lg border-l-4 border-izii-green bg-slate-50 py-2 pl-4 pr-4 text-slate-600" {...props} />
  ),
  table: (props) => (
    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm text-slate-600" {...props} />
    </div>
  ),
  th: (props) => <th className="border-b border-slate-200 bg-slate-100 px-4 py-2 text-left font-medium text-izii-charcoal" {...props} />,
  td: (props) => <td className="border-b border-slate-100 px-4 py-2" {...props} />
};
