import type { OpenApiDocument } from "@/lib/openapi/types";

// ─── Postman Collection v2.1 types ───────────────────────────────────────────

type PostmanAuth = {
  type: "bearer" | "noauth";
  bearer?: Array<{ key: string; value: string; type: string }>;
};

type PostmanHeader = { key: string; value: string; description?: string };

type PostmanUrlVariable = { key: string; value: string; description?: string };

type PostmanUrl = {
  raw: string;
  protocol?: string;
  host: string[];
  path: string[];
  variable?: PostmanUrlVariable[];
  query?: Array<{ key: string; value: string; description?: string; disabled?: boolean }>;
};

type PostmanBody = {
  mode: "raw";
  raw: string;
  options: { raw: { language: "json" | "text" } };
};

type PostmanRequest = {
  name: string;
  request: {
    auth?: PostmanAuth;
    method: string;
    header: PostmanHeader[];
    url: PostmanUrl;
    body?: PostmanBody;
    description?: string;
  };
  response: unknown[];
};

type PostmanFolder = {
  name: string;
  description?: string;
  item: PostmanRequest[];
};

export type PostmanCollection = {
  info: {
    name: string;
    description?: string;
    schema: string;
  };
  item: PostmanFolder[];
  variable: Array<{ key: string; value: string; type: string }>;
  auth: PostmanAuth;
};

// ─── Converter ────────────────────────────────────────────────────────────────

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

export function openApiToPostman(doc: OpenApiDocument, baseUrl?: string): PostmanCollection {
  const d = asRecord(doc);
  const info = asRecord(d?.["info"]);
  const name = asStr(info?.["title"]) ?? "API Collection";
  const description = asStr(info?.["description"]);

  const servers = asArr(d?.["servers"]);
  const defaultServer = baseUrl ?? asStr(asRecord(servers[0])?.["url"]) ?? "{{baseUrl}}";

  const tagDescMap = buildTagDescriptions(d);

  const tagMap = new Map<string, PostmanRequest[]>();
  const paths = asRecord(d?.["paths"]) ?? {};

  for (const [pathStr, pathItemRaw] of Object.entries(paths)) {
    const pathItem = asRecord(pathItemRaw) ?? {};
    const pathLevelParams = asArr(pathItem["parameters"]);

    for (const method of HTTP_METHODS) {
      const op = asRecord(pathItem[method]);
      if (!op) continue;

      const tags = asArr(op["tags"]);
      const tag = asStr(tags[0]) ?? "General";

      const item = buildItem(doc, pathStr, method.toUpperCase(), op, pathLevelParams, defaultServer);

      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push(item);
    }
  }

  // Preserve original tag order from spec
  const specTagOrder: string[] = asArr(d?.["tags"])
    .map((t) => asStr(asRecord(t)?.["name"]))
    .filter((n): n is string => Boolean(n));

  const allTags = [...specTagOrder, ...tagMap.keys()].filter(
    (t, i, arr) => arr.indexOf(t) === i
  );

  const folders: PostmanFolder[] = allTags
    .filter((t) => tagMap.has(t))
    .map((t) => ({
      name: t,
      description: tagDescMap.get(t),
      item: tagMap.get(t)!
    }));

  return {
    info: {
      name,
      description,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: folders,
    variable: [
      { key: "baseUrl", value: defaultServer, type: "string" },
      { key: "bearerToken", value: "", type: "string" }
    ],
    auth: {
      type: "bearer",
      bearer: [{ key: "token", value: "{{bearerToken}}", type: "string" }]
    }
  };
}

function buildTagDescriptions(d: Record<string, unknown> | null): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of asArr(d?.["tags"])) {
    const rec = asRecord(t);
    const name = asStr(rec?.["name"]);
    const desc = asStr(rec?.["description"]);
    if (name && desc) map.set(name, desc);
  }
  return map;
}

function buildItem(
  doc: OpenApiDocument,
  pathStr: string,
  method: string,
  op: Record<string, unknown>,
  pathLevelParams: unknown[],
  baseUrl: string
): PostmanRequest {
  const summary = asStr(op["summary"]) ?? `${method} ${pathStr}`;
  const description = asStr(op["description"]);

  // Merge path-level + operation-level parameters (op wins on same name+in)
  const mergedParams = mergeParams(doc, pathLevelParams, asArr(op["parameters"]));

  const pathParams = mergedParams.filter((p) => p.in === "path");
  const queryParams = mergedParams.filter((p) => p.in === "query");
  const headerParams = mergedParams.filter((p) => p.in === "header");

  // Build Postman URL
  const url = buildUrl(pathStr, baseUrl, pathParams, queryParams);

  // Build headers (explicit header params only — bearer handled via auth)
  const headers: PostmanHeader[] = headerParams.map((p) => ({
    key: p.name,
    value: p.example ? String(p.example) : "",
    description: p.description
  }));

  // Build body
  const body = buildBody(doc, op);
  if (body) {
    headers.push({ key: "Content-Type", value: "application/json" });
  }

  // Auth: suppress for auth token endpoint, use bearer for everything else
  const isTokenEndpoint = pathStr.endsWith("/v1/auth/token");
  const auth: PostmanAuth = isTokenEndpoint
    ? { type: "noauth" }
    : { type: "bearer", bearer: [{ key: "token", value: "{{bearerToken}}", type: "string" }] };

  return {
    name: summary,
    request: {
      auth,
      method,
      header: headers,
      url,
      ...(body ? { body } : {}),
      ...(description ? { description } : {})
    },
    response: []
  };
}

function buildUrl(
  pathStr: string,
  baseUrl: string,
  pathParams: Param[],
  queryParams: Param[]
): PostmanUrl {
  // Replace {param} with :param for Postman
  const postmanPath = pathStr.replace(/\{([^}]+)\}/g, ":$1");

  // Split baseUrl into protocol + host
  let protocol: string | undefined;
  let host: string[];
  let basePath: string[] = [];

  try {
    const parsed = new URL(baseUrl);
    protocol = parsed.protocol.replace(":", "");
    host = parsed.hostname.split(".");
    if (parsed.port) host[host.length - 1] += `:${parsed.port}`;
    basePath = parsed.pathname.replace(/^\//, "").split("/").filter(Boolean);
  } catch {
    // baseUrl is a variable like {{baseUrl}}
    host = [baseUrl];
  }

  const pathSegments = [...basePath, ...postmanPath.replace(/^\//, "").split("/").filter(Boolean)];
  const raw = `${protocol ? `${protocol}://` : ""}${host.join(".")}/${pathSegments.join("/")}`;

  return {
    raw,
    ...(protocol ? { protocol } : {}),
    host,
    path: pathSegments,
    ...(pathParams.length > 0
      ? {
          variable: pathParams.map((p) => ({
            key: p.name,
            value: p.example ? String(p.example) : "",
            description: p.description
          }))
        }
      : {}),
    ...(queryParams.length > 0
      ? {
          query: queryParams.map((p) => ({
            key: p.name,
            value: p.example ? String(p.example) : "",
            description: p.description,
            disabled: !p.required
          }))
        }
      : {})
  };
}

function buildBody(doc: OpenApiDocument, op: Record<string, unknown>): PostmanBody | null {
  const reqBodyRaw = deref(doc, op["requestBody"]);
  const reqBody = asRecord(reqBodyRaw);
  if (!reqBody) return null;

  const content = asRecord(reqBody["content"]);
  if (!content) return null;

  const jsonKey = Object.keys(content).find((k) => k.includes("json"));
  const anyKey = Object.keys(content)[0];
  const chosenKey = jsonKey ?? anyKey;
  if (!chosenKey) return null;

  const media = asRecord(content[chosenKey]);
  const example = media?.["example"] ?? pickFirstExample(media?.["examples"]);
  const schema = asRecord(deref(doc, media?.["schema"]));

  let raw = "{}";
  if (example !== undefined) {
    try { raw = JSON.stringify(example, null, 2); } catch { /* ignore */ }
  } else if (schema) {
    raw = JSON.stringify(schemaToExample(doc, schema), null, 2);
  }

  return {
    mode: "raw",
    raw,
    options: { raw: { language: chosenKey.includes("json") ? "json" : "text" } }
  };
}

// ─── Schema → example value ───────────────────────────────────────────────────

function schemaToExample(doc: OpenApiDocument, schema: Record<string, unknown>, depth = 0): unknown {
  if (depth > 4) return null;
  const resolved = asRecord(deref(doc, schema));
  if (!resolved) return null;

  if (resolved["example"] !== undefined) return resolved["example"];

  const type = asStr(resolved["type"]);

  if (resolved["properties"]) {
    const props = asRecord(resolved["properties"]) ?? {};
    const obj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(props)) {
      const propSchema = asRecord(deref(doc, val));
      if (propSchema) obj[key] = schemaToExample(doc, propSchema, depth + 1);
    }
    return obj;
  }

  if (type === "array" && resolved["items"]) {
    const itemSchema = asRecord(deref(doc, resolved["items"]));
    return itemSchema ? [schemaToExample(doc, itemSchema, depth + 1)] : [];
  }

  switch (type) {
    case "string": return asStr(resolved["example"]) ?? asStr(resolved["default"]) ?? "string";
    case "integer":
    case "number": return resolved["example"] ?? resolved["default"] ?? 0;
    case "boolean": return resolved["example"] ?? resolved["default"] ?? false;
    default: return null;
  }
}

// ─── Parameter merging ────────────────────────────────────────────────────────

type Param = {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  example?: unknown;
};

function mergeParams(doc: OpenApiDocument, pathLevel: unknown[], opLevel: unknown[]): Param[] {
  const map = new Map<string, Param>();
  for (const raw of [...pathLevel, ...opLevel]) {
    const p = asRecord(deref(doc, raw));
    if (!p) continue;
    const name = asStr(p["name"]);
    const inVal = asStr(p["in"]);
    if (!name || !inVal) continue;
    const example = p["example"] ?? asRecord(p["schema"])?.["example"];
    map.set(`${inVal}:${name}`, {
      name,
      in: inVal,
      required: Boolean(p["required"]),
      description: asStr(p["description"]),
      example
    });
  }
  return Array.from(map.values());
}

// ─── Ref resolution ───────────────────────────────────────────────────────────

function deref(doc: OpenApiDocument, value: unknown): unknown {
  const rec = asRecord(value);
  if (!rec) return value;
  const ref = rec["$ref"];
  if (typeof ref !== "string") return value;
  return resolveRef(asRecord(doc) ?? {}, ref) ?? value;
}

function resolveRef(root: Record<string, unknown>, ref: string): unknown {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref
    .slice(2)
    .split("/")
    .map((p) => decodeURIComponent(p.replace(/~1/g, "/").replace(/~0/g, "~")));
  let cur: unknown = root;
  for (const part of parts) {
    const r = asRecord(cur);
    if (!r) return undefined;
    cur = r[part];
  }
  return cur;
}

function pickFirstExample(examples: unknown): unknown {
  const rec = asRecord(examples);
  if (!rec) return undefined;
  for (const val of Object.values(rec)) {
    const ex = asRecord(val);
    const v = ex?.["value"] ?? ex?.["example"];
    if (v !== undefined) return v;
  }
  return undefined;
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}
function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function asStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}
