"use client";

import type { ReactNode } from "react";
import type { ApiNav } from "@/lib/openapi/types";
import { ExplorerSidebar } from "@/components/explorer/explorer-sidebar";
import { ResizableExplorerLayout } from "@/components/explorer/resizable-explorer-layout";

type ApiExplorerLayoutProps = {
  apiId: string;
  nav: ApiNav;
  docs: ReactNode;
  playground: ReactNode;
};

export function ApiExplorerLayout({ apiId, nav, docs, playground }: ApiExplorerLayoutProps) {
  return (
    <ResizableExplorerLayout
      left={<ExplorerSidebar apiId={apiId} nav={nav} />}
      center={docs}
      right={playground}
    />
  );
}
