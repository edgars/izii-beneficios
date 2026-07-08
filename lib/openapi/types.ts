import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type OpenApiDocument = OpenAPIV2.Document | OpenAPIV3.Document | OpenAPIV3_1.Document;

export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head"
  | "trace";

export type ApiOperation = {
  id: string;
  method: HttpMethod;
  path: string;
  tag: string;
  summary?: string;
  operationId?: string;
  deprecated?: boolean;
};

export type ApiNav = {
  tags: Array<{
    name: string;
    operations: ApiOperation[];
  }>;
  operationsById: Record<string, ApiOperation>;
};

