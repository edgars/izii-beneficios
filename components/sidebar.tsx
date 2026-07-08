"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ApiNav, ApiOperation } from "@/lib/openapi/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function Sidebar({ apiId, nav }: { apiId: string; nav: ApiNav }) {
  const params = useParams<{ endpoint?: string }>();
  const activeEndpoint = typeof params.endpoint === "string" ? params.endpoint : undefined;
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => filterNav(nav, query), [nav, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar endpoints…"
          className="h-9"
        />
      </div>
      <ScrollArea className="h-full">
        <nav className="flex flex-col gap-4 p-3">
          {filtered.tags.map((group) => (
            <section key={group.name} className="space-y-2">
              <div className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.name}
              </div>
              <ul className="space-y-1">
                {group.operations.map((op) => (
                  <li key={op.id}>
                    <SidebarLink apiId={apiId} op={op} active={op.id === activeEndpoint} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

function SidebarLink({ apiId, op, active }: { apiId: string; op: ApiOperation; active: boolean }) {
  return (
    <Link
      href={`/${apiId}/${op.id}`}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
        active && "bg-accent"
      )}
    >
      <Badge variant={methodBadgeVariant(op.method)} className="min-w-14 justify-center uppercase">
        {op.method}
      </Badge>
      <div className="min-w-0">
        <div className="truncate font-medium">{op.summary ?? op.path}</div>
        <div className="truncate text-xs text-muted-foreground">{op.path}</div>
      </div>
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
