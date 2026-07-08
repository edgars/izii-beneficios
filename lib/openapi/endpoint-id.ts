import "server-only";

import type { HttpMethod } from "@/lib/openapi/types";

export function encodeEndpointId(method: HttpMethod, path: string) {
  return Buffer.from(`${method.toUpperCase()} ${path}`).toString("base64url");
}

export function decodeEndpointId(endpointId: string): { method: HttpMethod; path: string } | null {
  try {
    const decoded = Buffer.from(endpointId, "base64url").toString("utf8");
    const [rawMethod, ...rawPathParts] = decoded.split(" ");
    const rawPath = rawPathParts.join(" ").trim();
    const method = rawMethod?.toLowerCase() as HttpMethod;

    if (!isHttpMethod(method) || !rawPath.startsWith("/")) return null;
    return { method, path: rawPath };
  } catch {
    return null;
  }
}

function isHttpMethod(value: string): value is HttpMethod {
  return (
    value === "get" ||
    value === "post" ||
    value === "put" ||
    value === "patch" ||
    value === "delete" ||
    value === "options" ||
    value === "head" ||
    value === "trace"
  );
}
