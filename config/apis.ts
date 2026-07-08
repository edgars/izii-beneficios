import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { parseOpenApiDocument } from "@/lib/openapi/parse";
import type { OpenApiDocument } from "@/lib/openapi/types";

export type ApiSource =
  | { kind: "local"; filePath: string }
  | { kind: "remote"; url: string };

export type ApiConfig = {
  id: string;
  name: string;
  description?: string;
  source: ApiSource;
  baseUrl?: string;
  allowedHosts?: string[];
};

const GATEWAY_URL = process.env.GATEWAY_URL;
const gatewayHost = GATEWAY_URL ? (() => { try { return new URL(GATEWAY_URL).host; } catch { return undefined; } })() : undefined;

/** Overrides opcionais por apiId (hosts, baseUrl). Specs em /specs são a fonte principal. */
const API_OVERRIDES: Record<string, Partial<Pick<ApiConfig, "baseUrl" | "allowedHosts" | "name" | "description">>> = {
  izzi: {
    baseUrl: GATEWAY_URL ?? "https://api.sandbox.exemplo.com",
    ...(gatewayHost ? { allowedHosts: [gatewayHost] } : {})
  },
  "izzi-rest": {
    baseUrl: GATEWAY_URL ?? "https://api.izii.com.br",
    ...(gatewayHost ? { allowedHosts: [gatewayHost] } : {})
  }
};

/** Specs remotas adicionais (além dos arquivos em /specs). */
const REMOTE_APIS: ApiConfig[] = [];

function normalizeApiId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

export async function getDefaultApiId(): Promise<string> {
  const apis = await listApis();
  const preferred = ["izzi-rest", "izzi", "example"];
  for (const id of preferred) {
    if (apis.some((a) => a.id === id)) return id;
  }
  return apis[0]?.id ?? "example";
}

export async function getApiConfigSafe(apiId: string): Promise<ApiConfig | undefined> {
  const id = normalizeApiId(apiId);
  const apis = await listApis();
  return apis.find((api) => api.id === id);
}

export async function getApiConfig(apiId: string): Promise<ApiConfig> {
  const api = await getApiConfigSafe(apiId);
  if (!api) throw new Error(`Unknown apiId: ${apiId}`);
  return api;
}

export async function listApis(): Promise<ApiConfig[]> {
  return listApisCached();
}

const listApisCached = cache(async (): Promise<ApiConfig[]> => {
  const fromSpecs = await listLocalSpecs();
  const merged = [...fromSpecs];

  for (const remote of REMOTE_APIS) {
    if (!merged.some((a) => a.id === remote.id)) merged.push(remote);
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name));
});

async function listLocalSpecs(): Promise<ApiConfig[]> {
  const specsDir = path.join(process.cwd(), "specs");
  let entries: string[] = [];
  try {
    entries = await readdir(specsDir);
  } catch {
    return [];
  }

  const files = entries.filter((name) => /\.(ya?ml|json)$/i.test(name)).sort();
  const apis: ApiConfig[] = [];

  for (const fileName of files) {
    const filePath = `specs/${fileName}`;
    const id = normalizeApiId(fileName.replace(/\.(ya?ml|json)$/i, ""));
    const override = API_OVERRIDES[id] ?? {};

    try {
      const absolute = path.join(process.cwd(), filePath);
      const raw = await readFile(absolute, "utf8");
      const doc = await parseOpenApiDocument(raw, filePath);
      const info = asRecord(doc.info);
      const title = asString(info?.["title"]);
      const description = asString(info?.["description"]);
      const baseFromSpec = pickServerUrl(doc as OpenApiDocument);

      apis.push({
        id,
        name: override.name ?? title ?? id,
        description: override.description ?? description,
        source: { kind: "local", filePath },
        baseUrl: override.baseUrl ?? baseFromSpec,
        allowedHosts: override.allowedHosts
      });
    } catch {
      apis.push({
        id,
        name: override.name ?? fileName.replace(/\.(ya?ml|json)$/i, ""),
        description: override.description,
        source: { kind: "local", filePath },
        baseUrl: override.baseUrl,
        allowedHosts: override.allowedHosts
      });
    }
  }

  return apis;
}

function pickServerUrl(doc: OpenApiDocument): string | undefined {
  if (!("servers" in doc) || !Array.isArray(doc.servers) || doc.servers.length === 0) return undefined;
  const first = doc.servers[0] as { url?: string } | undefined;
  return typeof first?.url === "string" ? first.url : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
