import { ApiEndpointDocs } from "@/components/api-endpoint-docs";
import { getOpenApiDocument } from "@/lib/openapi";
import { resolveSchema } from "@/lib/openapi/resolve-schema";
import type { OperationDetails } from "@/lib/openapi/operation-types";

export async function ApiEndpointDocsPanel({
  apiId,
  operation
}: {
  apiId: string;
  operation: OperationDetails;
}) {
  const doc = await getOpenApiDocument(apiId);

  const requestSchema = operation.requestBody?.schema
    ? resolveSchema(doc, operation.requestBody.schema)
    : null;

  const responseSchemas = operation.responses.map((response) => ({
    status: response.status,
    schema: response.schema ? resolveSchema(doc, response.schema) : null
  }));

  const parameters = operation.parameters.map((param) => ({
    ...param,
    resolvedType: param.schema ? resolveSchema(doc, param.schema)?.type : undefined
  }));

  return (
    <ApiEndpointDocs
      operation={{ ...operation, parameters }}
      requestSchema={requestSchema}
      responseSchemas={responseSchemas}
    />
  );
}
