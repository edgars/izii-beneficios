import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidateTag } from "next/cache";
import { cache } from "react";
import type { ApiConfig } from "@/config/apis";
import { getApiConfig } from "@/config/apis";
import { parseOpenApiDocument } from "@/lib/openapi/parse";
import type { OpenApiDocument } from "@/lib/openapi/types";

export function apiSpecTag(apiId: string) {
  return `openapi-spec:${apiId}`;
}

export const getOpenApiDocument = cache(async (apiId: string): Promise<OpenApiDocument> => {
  const api = await getApiConfig(apiId);
  const raw = await readSpecSource(apiId, api);
  return await parseOpenApiDocument(raw, api.source.kind === "local" ? api.source.filePath : api.source.url);
});

export function revalidateApiSpec(apiId: string) {
  revalidateTag(apiSpecTag(apiId));
}

async function readSpecSource(apiId: string, api: ApiConfig): Promise<string> {
  if (api.source.kind === "local") {
    const absolute = path.join(process.cwd(), api.source.filePath);
    return await readFile(absolute, "utf8");
  }

  const tag = apiSpecTag(apiId);
  const res = await fetch(api.source.url, {
    next: { tags: [tag], revalidate: 3600 },
    headers: {
      accept: "application/json, application/yaml, text/yaml, */*"
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch spec (${res.status}) for ${apiId} from ${api.source.url}`);
  }

  return await res.text();
}

