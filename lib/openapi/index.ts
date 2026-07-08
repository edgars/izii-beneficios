import type { OpenApiDocument, ApiNav } from "@/lib/openapi/types";
import { buildNav } from "@/lib/openapi/nav";

export type { OpenApiDocument, ApiNav } from "@/lib/openapi/types";
export { apiSpecTag, revalidateApiSpec, getOpenApiDocument } from "@/lib/openapi/load";
export { getOperationDetails, findOperationByEndpointId } from "@/lib/openapi/operation";

export function getOpenApiNav(doc: OpenApiDocument): ApiNav {
  return buildNav(doc);
}
