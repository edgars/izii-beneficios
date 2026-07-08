"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Download, Menu } from "lucide-react";
import type { ApiConfig } from "@/config/apis";
import { APP_NAME } from "@/config/brand";
import { PortalLogo } from "@/components/portal-logo";
import { ApiSelector } from "@/components/api-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function OpenApiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#6BA539" />
      <path
        d="M20 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8.5 4.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm17 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM9 20c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm22 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-13.5 7.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8.5 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
        fill="white"
        opacity="0.9"
      />
      <circle cx="20" cy="20" r="5" fill="white" opacity="0.95" />
      <circle cx="20" cy="20" r="3" fill="#6BA539" />
    </svg>
  );
}

function PostmanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#FF6C37" />
      <path
        d="M22.5 11.5c-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5 8.5-3.8 8.5-8.5-3.8-8.5-8.5-8.5zm0 15c-3.6 0-6.5-2.9-6.5-6.5s2.9-6.5 6.5-6.5 6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5z"
        fill="white"
        opacity="0.9"
      />
      <path
        d="M19.5 17l5 3-5 3V17z"
        fill="white"
      />
      <circle cx="13" cy="20" r="3.5" fill="white" opacity="0.6" />
    </svg>
  );
}

export function PortalTopbar({
  apiId,
  apis,
  apiName,
  mobileNav
}: {
  apiId: string;
  apis: ApiConfig[];
  apiName: string;
  mobileNav?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4">
        {mobileNav ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Abrir navegação">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] border-slate-200 bg-card p-0">
              <SheetHeader className="border-b border-slate-200 px-4 py-3">
                <SheetTitle className="text-sm">Endpoints</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100dvh-56px)]">{mobileNav}</div>
            </SheetContent>
          </Sheet>
        ) : null}

        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-izii-charcoal transition hover:text-izii-charcoal"
          aria-label={`${APP_NAME} — início`}
        >
          <PortalLogo className="h-6 max-h-7" />
          <span className="sr-only">{APP_NAME}</span>
        </Link>
        <span className="text-slate-300">/</span>
        <span className="truncate text-sm text-slate-500">{apiName}</span>

        <div className="flex-1" />

        <ApiSelector value={apiId} apis={apis} />

        {/* Downloads dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-1.5 border-slate-200 text-xs text-slate-600 hover:text-izii-charcoal sm:inline-flex"
            >
              <Download className="h-3.5 w-3.5" />
              Downloads
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-xs text-slate-400">Especificação</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <a
                href={`/api/specs/${apiId}/openapi`}
                download
                className="flex cursor-pointer items-center gap-2"
              >
                <OpenApiIcon className="h-4 w-4 shrink-0" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm">OpenAPI</span>
                  <span className="text-[10px] text-slate-400">spec YAML · v3.0</span>
                </div>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-slate-400">Postman</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <a
                href={`/api/specs/${apiId}/postman`}
                download
                className="flex cursor-pointer items-center gap-2"
              >
                <PostmanIcon className="h-4 w-4 shrink-0" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm">Coleção RESTful</span>
                  <span className="text-[10px] text-slate-400">gerada da spec · v2.1</span>
                </div>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`/postman/${apiId}.postman_collection.json`}
                download
                className="flex cursor-pointer items-center gap-2"
              >
                <PostmanIcon className="h-4 w-4 shrink-0" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm">Coleção Manual</span>
                  <span className="text-[10px] text-slate-400">dados mockados · RPC</span>
                </div>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/${apiId}/postman`}
                className="flex cursor-pointer items-center gap-2"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm">Guia de integração</span>
                  <span className="text-[10px] text-slate-400">documentação Postman</span>
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href="/docs/referencia-rest"
          className="hidden rounded-md px-3 py-1.5 text-xs text-slate-500 transition hover:text-izii-charcoal sm:inline"
        >
          Manuais de Usuário
        </Link>
      </div>
    </header>
  );
}
