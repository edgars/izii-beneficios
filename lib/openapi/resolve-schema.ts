import "server-only";

import type { OpenApiDocument } from "@/lib/openapi/types";

export type SchemaField = {
  name?: string;
  type: string;
  description?: string;
  required?: boolean;
  format?: string;
  enumValues?: unknown[];
  example?: unknown;
  properties?: SchemaField[];
  items?: SchemaField;
  refs?: string[];
};

const MAX_DEPTH = 12;

export function resolveSchema(
  doc: OpenApiDocument,
  schema: unknown,
  options?: { name?: string; required?: boolean; visited?: Set<string> }
): SchemaField | null {
  const visited = options?.visited ?? new Set<string>();
  return walk(doc, schema, options?.name, options?.required ?? false, visited, 0);
}

function walk(
  doc: OpenApiDocument,
  raw: unknown,
  name: string | undefined,
  required: boolean,
  visited: Set<string>,
  depth: number
): SchemaField | null {
  if (raw === undefined || raw === null || depth > MAX_DEPTH) return null;

  const node = deref(doc, raw);
  if (!node) return null;

  const ref = typeof node["$ref"] === "string" ? node["$ref"] : undefined;
  if (ref) {
    if (visited.has(ref)) {
      return { name, type: "object", required, refs: [ref] };
    }
    visited.add(ref);
    const resolved = resolveLocalRef(doc, ref);
    if (resolved) {
      const inner = walk(doc, resolved, name, required, visited, depth + 1);
      if (inner) return { ...inner, refs: [ref, ...(inner.refs ?? [])] };
    }
  }

  const type = inferType(node);
  const field: SchemaField = {
    name,
    type,
    required,
    description: asString(node["description"]),
    format: asString(node["format"]),
    enumValues: Array.isArray(node["enum"]) ? node["enum"] : undefined,
    example: node["example"]
  };

  if (type === "array") {
    const items = walk(doc, node["items"], undefined, false, new Set(visited), depth + 1);
    if (items) field.items = items;
    return field;
  }

  if (node["properties"] && typeof node["properties"] === "object") {
    const requiredSet = new Set(
      Array.isArray(node["required"]) ? node["required"].filter((k): k is string => typeof k === "string") : []
    );
    const props = node["properties"] as Record<string, unknown>;
    field.properties = Object.entries(props)
      .map(([propName, propSchema]) =>
        walk(doc, propSchema, propName, requiredSet.has(propName), new Set(visited), depth + 1)
      )
      .filter((p): p is SchemaField => p !== null);
    return field;
  }

  const combinators = ["allOf", "oneOf", "anyOf"] as const;
  for (const key of combinators) {
    const parts = node[key];
    if (!Array.isArray(parts)) continue;
    field.type = key;
    field.properties = parts
      .map((part, index) => walk(doc, part, `option ${index + 1}`, false, new Set(visited), depth + 1))
      .filter((p): p is SchemaField => p !== null);
    return field;
  }

  if (node["additionalProperties"] && node["additionalProperties"] !== true) {
    const extra = walk(doc, node["additionalProperties"], "additionalProperties", false, new Set(visited), depth + 1);
    if (extra) field.properties = [...(field.properties ?? []), extra];
  }

  return field;
}

function inferType(node: Record<string, unknown>): string {
  if (typeof node["type"] === "string") return node["type"];
  if (node["properties"]) return "object";
  if (node["items"]) return "array";
  if (node["allOf"]) return "allOf";
  if (node["oneOf"]) return "oneOf";
  if (node["anyOf"]) return "anyOf";
  return "object";
}

function deref(doc: OpenApiDocument, value: unknown): Record<string, unknown> | null {
  const record = asRecord(value);
  if (!record) return null;
  const ref = record["$ref"];
  if (typeof ref !== "string") return record;
  return asRecord(resolveLocalRef(doc, ref)) ?? record;
}

function resolveLocalRef(doc: OpenApiDocument, ref: string): unknown {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref
    .slice(2)
    .split("/")
    .map((p) => decodeURIComponent(p.replace(/~1/g, "/").replace(/~0/g, "~")));

  let current: unknown = doc;
  for (const part of parts) {
    const cur = asRecord(current);
    if (!cur) return undefined;
    current = cur[part];
  }
  return current;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
