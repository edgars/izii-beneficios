import "server-only";

import type { OpenApiDocument, ApiNav, ApiOperation, HttpMethod } from "@/lib/openapi/types";
import { encodeEndpointId } from "@/lib/openapi/endpoint-id";

const METHODS_IN_ORDER: HttpMethod[] = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];

export function buildNav(doc: OpenApiDocument): ApiNav {
  const operations: ApiOperation[] = [];

  if (!("paths" in doc) || !doc.paths) {
    return { tags: [], operationsById: {} };
  }

  const paths = doc.paths as Record<string, unknown>;
  const sortedPaths = Object.keys(paths).sort((a, b) => a.localeCompare(b));

  for (const path of sortedPaths) {
    const pathItem = paths[path] as Record<string, unknown> | undefined;
    if (!pathItem) continue;

    for (const method of METHODS_IN_ORDER) {
      const operation = pathItem[method] as Record<string, unknown> | undefined;
      if (!operation) continue;

      const tag = pickFirstTag(operation) ?? "General";
      const summary = (operation.summary as string | undefined) ?? undefined;
      const operationId = (operation.operationId as string | undefined) ?? undefined;
      const deprecated = Boolean(operation.deprecated);

      operations.push({
        id: encodeEndpointId(method, path),
        method,
        path,
        tag,
        summary,
        operationId,
        deprecated
      });
    }
  }

  const groups = new Map<string, ApiOperation[]>();
  for (const op of operations) {
    const list = groups.get(op.tag) ?? [];
    list.push(op);
    groups.set(op.tag, list);
  }

  const tags = Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, ops]) => ({
      name,
      operations: ops.sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method))
    }));

  const operationsById: Record<string, ApiOperation> = {};
  for (const op of operations) operationsById[op.id] = op;

  return { tags, operationsById };
}

function pickFirstTag(operation: Record<string, unknown>): string | undefined {
  const tags = operation.tags as unknown;
  if (!Array.isArray(tags)) return undefined;
  const first = tags.find((t) => typeof t === "string");
  return typeof first === "string" && first.trim().length > 0 ? first : undefined;
}
