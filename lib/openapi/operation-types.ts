import type { ApiOperation } from "@/lib/openapi/types";

export type OperationParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: unknown;
  example?: unknown;
};

export type OperationRequestBody = {
  required?: boolean;
  contentType?: string;
  schema?: unknown;
  example?: unknown;
};

export type OperationResponse = {
  status: string;
  description?: string;
  contentType?: string;
  schema?: unknown;
  example?: unknown;
};

export type OperationDetails = ApiOperation & {
  description?: string;
  servers: string[];
  parameters: OperationParameter[];
  requestBody?: OperationRequestBody;
  responses: OperationResponse[];
};

