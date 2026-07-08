import { notFound } from "next/navigation";
import { ApiConsolePlayground } from "@/components/api-console-playground";
import { ApiEndpointDocsPanel } from "@/components/api-endpoint-docs-panel";
import { ApiExplorerLayout } from "@/components/api-explorer-layout";
import { ExplorerSidebar } from "@/components/explorer/explorer-sidebar";
import { PortalTopbar } from "@/components/portal-topbar";
import { getApiConfigSafe, listApis } from "@/config/apis";
import {
  findOperationByEndpointId,
  getOpenApiDocument,
  getOpenApiNav,
  getOperationDetails
} from "@/lib/openapi";

export const revalidate = 3600;

export default async function ApiEndpointPage({
  params
}: {
  params: Promise<{ apiId: string; endpoint: string }>;
}) {
  const { apiId, endpoint } = await params;

  const api = await getApiConfigSafe(apiId);
  if (!api) notFound();

  const [apis, doc] = await Promise.all([listApis(), getOpenApiDocument(apiId)]);
  const nav = getOpenApiNav(doc);

  const meta = nav.operationsById[endpoint] ?? findOperationByEndpointId(doc, endpoint);
  if (!meta) notFound();

  const details = getOperationDetails(doc, meta);
  if (!details) notFound();

  const defaultBaseUrl = api.baseUrl ?? details.servers[0] ?? "";

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-background">
      <PortalTopbar
        apiId={apiId}
        apis={apis}
        apiName={api.name}
        mobileNav={<ExplorerSidebar apiId={apiId} nav={nav} />}
      />
      <ApiExplorerLayout
        apiId={apiId}
        nav={nav}
        docs={<ApiEndpointDocsPanel apiId={apiId} operation={details} />}
        playground={
          <ApiConsolePlayground apiId={apiId} operation={details} defaultBaseUrl={defaultBaseUrl} />
        }
      />
    </div>
  );
}
