import "server-only";

import type { OpenApiDocument, HttpMethod } from "@/lib/openapi/types";
import type { ApiOperation } from "@/lib/openapi/types";
import { decodeEndpointId } from "@/lib/openapi/endpoint-id";
import type { OperationDetails, OperationParameter, OperationRequestBody, OperationResponse } from "@/lib/openapi/operation-types";

export type { OperationDetails, OperationParameter, OperationRequestBody, OperationResponse } from "@/lib/openapi/operation-types";

export function getOperationDetails(doc: OpenApiDocument, op: ApiOperation): OperationDetails | null {
  const operation = getOperationObject(doc, op.method, op.path);
  if (!operation) return null;

  const servers = collectServers(doc, op.path, operation);
  const parameters = collectParameters(doc, op.path, operation);
  const requestBody = collectRequestBody(doc, operation);
  const responses = collectResponses(doc, operation);
  const description = asOptionalString(operation.description);

  return { ...op, description, servers, parameters, requestBody, responses };
}

export function findOperationByEndpointId(doc: OpenApiDocument, endpointId: string): ApiOperation | null {
  const decoded = decodeEndpointId(endpointId);
  if (!decoded) return null;

  const method = decoded.method;
  const path = decoded.path;
  const operation = getOperationObject(doc, method, path);
  if (!operation) return null;

  const tag = pickFirstTag(operation) ?? "General";
  const summary = asOptionalString(operation.summary) ?? path;
  const operationId = asOptionalString(operation.operationId);
  const deprecated = Boolean(operation.deprecated);

  return { id: endpointId, method, path, tag, summary, operationId, deprecated };
}

function getOperationObject(doc: OpenApiDocument, method: HttpMethod, path: string): Record<string, unknown> | null {
  if (!("paths" in doc) || !doc.paths) return null;
  const paths = doc.paths as Record<string, unknown>;
  const pathItem = paths[path] as Record<string, unknown> | undefined;
  if (!pathItem) return null;
  const operation = pathItem[method] as Record<string, unknown> | undefined;
  if (!operation) return null;
  return operation;
}

function collectServers(
  doc: OpenApiDocument,
  path: string,
  operation: Record<string, unknown>
): string[] {
  const docRecord = asRecord(doc);
  const docServers = docRecord?.["servers"];

  const pathItem = getPathItemObject(doc, path);
  const pathServers = pathItem?.["servers"];

  const opServers = operation["servers"];

  const allServers = [...asArray(docServers), ...asArray(pathServers), ...asArray(opServers)];
  const urls = allServers
    .map((s) => {
      const server = asRecord(s);
      if (!server) return null;
      const url = server["url"];
      if (typeof url !== "string") return null;
      return resolveServerVariables(url, server["variables"]);
    })
    .filter((u): u is string => Boolean(u));

  return Array.from(new Set(urls));
}

function resolveServerVariables(url: string, variables: unknown) {
  const vars = asRecord(variables);
  if (!vars) return url;
  return url.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_m, key: string) => {
    const variable = asRecord(vars[key]);
    const def = variable?.["default"];
    return typeof def === "string" ? def : `{${key}}`;
  });
}

function collectParameters(
  doc: OpenApiDocument,
  path: string,
  operation: Record<string, unknown>
): OperationParameter[] {
  const pathItem = getPathItemObject(doc, path);

  const merged: OperationParameter[] = [];
  const seen = new Map<string, number>();

  const all = [
    ...asArray(pathItem?.["parameters"]),
    ...asArray(operation["parameters"])
  ];

  for (const p of all) {
    const param = asRecord(deref(doc, p));
    if (!param) continue;
    const location = param["in"];
    const name = param["name"];
    if (!isParamLocation(location)) continue;
    if (typeof name !== "string" || !name) continue;

    const key = `${location}:${name}`;
    const candidate: OperationParameter = {
      name,
      in: location,
      required: Boolean(param["required"]),
      description: asOptionalString(param["description"]),
      schema: param["schema"],
      example: param["example"]
    };

    const existingIndex = seen.get(key);
    if (existingIndex === undefined) {
      seen.set(key, merged.length);
      merged.push(candidate);
    } else {
      merged[existingIndex] = candidate;
    }
  }

  return merged;
}

function collectRequestBody(doc: OpenApiDocument, operation: Record<string, unknown>): OperationRequestBody | undefined {
  const raw = asRecord(deref(doc, operation["requestBody"]));
  if (!raw) return undefined;

  const content = asRecord(raw["content"]);
  if (!content) return undefined;

  const contentTypes = Object.keys(content);
  const preferred =
    contentTypes.find((ct) => ct.includes("application/json")) ??
    contentTypes.find((ct) => ct.includes("application/")) ??
    contentTypes[0];

  if (!preferred) return undefined;
  const media = asRecord(content[preferred]);

  return {
    required: Boolean(raw["required"]),
    contentType: preferred,
    schema: media?.["schema"],
    example: media?.["example"] ?? pickFirstExample(media?.["examples"])
  };
}

function pickFirstExample(examples: unknown) {
  const record = asRecord(examples);
  if (!record) return undefined;
  for (const value of Object.values(record)) {
    const example = asRecord(value);
    const resolved = example?.["value"] ?? example?.["example"];
    if (resolved !== undefined) return resolved;
  }
  return undefined;
}

function collectResponses(doc: OpenApiDocument, operation: Record<string, unknown>): OperationResponse[] {
  const responses = asRecord(operation["responses"]);
  if (!responses) return [];

  const entries = Object.entries(responses);
  entries.sort(([a], [b]) => {
    if (a === "default") return 1;
    if (b === "default") return -1;
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const result: OperationResponse[] = [];
  for (const [status, rawResp] of entries) {
    const resp = asRecord(deref(doc, rawResp));
    if (!resp) continue;

    const content = asRecord(resp["content"]);
    if (!content) {
      result.push({ status, description: asOptionalString(resp["description"]) });
      continue;
    }

    const contentTypes = Object.keys(content);
    const preferred =
      contentTypes.find((ct) => ct.includes("application/json")) ??
      contentTypes.find((ct) => ct.includes("application/")) ??
      contentTypes[0];
    const media = preferred ? asRecord(content[preferred]) : undefined;

    result.push({
      status,
      description: asOptionalString(resp["description"]),
      contentType: preferred,
      schema: media?.["schema"],
      example: media?.["example"] ?? pickFirstExample(media?.["examples"])
    });
  }

  return result;
}

function deref(doc: OpenApiDocument, value: unknown): unknown {
  const record = asRecord(value);
  if (!record) return value;
  const ref = record["$ref"];
  if (typeof ref !== "string") return value;
  return resolveLocalRef(asRecord(doc) ?? ({} as Record<string, unknown>), ref) ?? value;
}

function resolveLocalRef(root: Record<string, unknown>, ref: string): unknown {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref
    .slice(2)
    .split("/")
    .map((p) => decodeURIComponent(p.replace(/~1/g, "/").replace(/~0/g, "~")));

  let current: unknown = root;
  for (const part of parts) {
    const cur = asRecord(current);
    if (!cur) return undefined;
    current = cur[part];
  }
  return current;
}

function pickFirstTag(operation: Record<string, unknown>): string | undefined {
  const tags = operation.tags as unknown;
  if (!Array.isArray(tags)) return undefined;
  const first = tags.find((t) => typeof t === "string");
  return typeof first === "string" && first.trim().length > 0 ? first : undefined;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function isParamLocation(value: unknown): value is OperationParameter["in"] {
  return value === "path" || value === "query" || value === "header" || value === "cookie";
}

function getPathItemObject(doc: OpenApiDocument, path: string): Record<string, unknown> | null {
  if (!("paths" in doc) || !doc.paths) return null;
  const paths = doc.paths as Record<string, unknown>;
  return asRecord(paths[path]);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
