"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import type { ApiNav, ApiOperation } from "@/lib/openapi/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ExplorerSidebar({ apiId, nav }: { apiId: string; nav: ApiNav }) {
  const params = useParams<{ endpoint?: string }>();
  const activeEndpoint = typeof params.endpoint === "string" ? params.endpoint : undefined;
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => filterNav(nav, query), [nav, query]);

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-slate-200 p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar endpoints…"
          className="h-9 border-slate-200 bg-white transition focus-visible:ring-izii-lime/40"
        />
      </div>
      <ScrollArea className="flex-1">
        <LayoutGroup>
        <nav className="flex flex-col gap-1 p-2">
          {filtered.tags.map((group, groupIndex) => (
            <section key={group.name} className="mb-3">
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.03 }}
                className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500"
              >
                {group.name}
              </motion.div>
              <ul className="space-y-0.5">
                {group.operations.map((op, opIndex) => (
                  <motion.li
                    key={op.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.03 + opIndex * 0.02 }}
                    layout
                  >
                    <SidebarLink apiId={apiId} op={op} active={op.id === activeEndpoint} />
                  </motion.li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
        </LayoutGroup>
      </ScrollArea>
    </div>
  );
}

function SidebarLink({ apiId, op, active }: { apiId: string; op: ApiOperation; active: boolean }) {
  return (
    <Link href={`/${apiId}/${op.id}`} className="group relative block rounded-lg outline-none">
      {active ? (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg bg-izii-lime/15 ring-1 ring-izii-lime/30"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      ) : null}
      <motion.span
        className={cn(
          "relative flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
          active ? "text-izii-charcoal" : "text-slate-600"
        )}
        whileHover={active ? undefined : { x: 4, backgroundColor: "rgba(241,245,249,1)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <Badge
          variant={methodBadgeVariant(op.method)}
          className="min-w-[3.25rem] shrink-0 justify-center text-[10px] uppercase"
        >
          {op.method}
        </Badge>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{op.summary ?? op.path}</span>
          <span className="block truncate text-xs text-slate-400 group-hover:text-slate-500">{op.path}</span>
        </span>
      </motion.span>
    </Link>
  );
}

function methodBadgeVariant(method: ApiOperation["method"]) {
  switch (method) {
    case "get":
      return "success";
    case "post":
      return "info";
    case "delete":
      return "destructive";
    case "put":
    case "patch":
      return "warning";
    default:
      return "secondary";
  }
}

function filterNav(nav: ApiNav, query: string): ApiNav {
  const q = query.trim().toLowerCase();
  if (!q) return nav;

  const tags = nav.tags
    .map((group) => ({
      name: group.name,
      operations: group.operations.filter((op) => matches(op, q))
    }))
    .filter((group) => group.operations.length > 0);

  const operationsById: Record<string, ApiOperation> = {};
  for (const group of tags) {
    for (const op of group.operations) operationsById[op.id] = op;
  }

  return { tags, operationsById };
}

function matches(op: ApiOperation, q: string) {
  return (
    op.path.toLowerCase().includes(q) ||
    op.method.toLowerCase().includes(q) ||
    (op.summary?.toLowerCase().includes(q) ?? false) ||
    (op.operationId?.toLowerCase().includes(q) ?? false) ||
    op.tag.toLowerCase().includes(q)
  );
}
