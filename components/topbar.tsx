"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import type { ApiConfig } from "@/config/apis";
import { APP_NAME } from "@/config/brand";
import { PortalLogo } from "@/components/portal-logo";
import type { ApiNav } from "@/lib/openapi/types";
import { ApiSelector } from "@/components/api-selector";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Topbar({ apiId, apis, nav }: { apiId: string; apis: ApiConfig[]; nav: ApiNav }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir navegação">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle className="text-sm font-medium">Endpoints</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100dvh-56px)]">
              <Sidebar apiId={apiId} nav={nav} />
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2" aria-label={`${APP_NAME} — início`}>
          <PortalLogo className="h-6 max-h-7 brightness-0 dark:brightness-100" />
          <span className="sr-only">{APP_NAME}</span>
        </Link>

        <div className="flex-1" />

        <ApiSelector value={apiId} apis={apis} />
        <ThemeToggle />
      </div>
    </header>
  );
}
