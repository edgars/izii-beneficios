"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ApiConfig } from "@/config/apis";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ApiSelector({
  value,
  apis,
  className
}: {
  value: string;
  apis: ApiConfig[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={value}
      onValueChange={(nextApiId) => {
        const next = `/${nextApiId}`;
        if (pathname === next) return;
        router.push(next);
      }}
    >
      <SelectTrigger
        className={cn(
          "h-8 w-[min(11rem,38vw)] shrink-0 border-slate-200 bg-white px-2 text-[11px] font-medium leading-tight text-izii-charcoal shadow-none",
          "focus:ring-1 focus:ring-izii-lime/40 focus:ring-offset-0",
          "[&>span]:line-clamp-1 [&>span]:text-left",
          className
        )}
        title={apis.find((a) => a.id === value)?.name}
      >
        <SelectValue placeholder="Selecione uma API" />
      </SelectTrigger>
      <SelectContent className="border-slate-200 bg-white shadow-lg text-izii-charcoal">
        {apis.map((api) => (
          <SelectItem
            key={api.id}
            value={api.id}
            className="text-[11px] focus:bg-slate-100 focus:text-izii-green"
            title={api.name}
          >
            <span className="line-clamp-1">{api.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
