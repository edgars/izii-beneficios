import { NextResponse } from "next/server";
import { getApiConfigSafe } from "@/config/apis";
import { getOpenApiDocument } from "@/lib/openapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ProxyRequest = {
  apiId: string;
  method: string;
  baseUrl?: string;
  path: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
  contentType?: string;
};

export async function POST(request: Request) {
  let payload: ProxyRequest;
  try {
    payload = (await request.json()) as ProxyRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const api = await getApiConfigSafe(payload.apiId);
  if (!api) return NextResponse.json({ ok: false, error: "Unknown apiId." }, { status: 400 });

  if (!isSafePath(payload.path)) {
    return NextResponse.json({ ok: false, error: "Invalid path." }, { status: 400 });
  }

  let doc: unknown = null;
  try {
    doc = await getOpenApiDocument(payload.apiId);
  } catch {
    // spec unavailable — allowlist built from config only
  }
  const allowlist = buildHostAllowlist(api.allowedHosts, api.baseUrl, doc);

  const baseUrl = typeof payload.baseUrl === "string" && payload.baseUrl.trim().length > 0 ? payload.baseUrl : api.baseUrl;
  if (!baseUrl) return NextResponse.json({ ok: false, error: "Missing baseUrl." }, { status: 400 });

  const method = normalizeMethod(payload.method);
  if (!method) return NextResponse.json({ ok: false, error: "Unsupported HTTP method." }, { status: 400 });

  let upstreamUrl: string;
  try {
    upstreamUrl = buildUrl(baseUrl, payload.path, payload.query);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Invalid baseUrl/path." },
      { status: 400 }
    );
  }
  if (!isAllowedHost(allowlist, upstreamUrl, api.allowedHosts != null)) {
    return NextResponse.json(
      { ok: false, error: "Upstream host is not allowed for this apiId/spec servers." },
      { status: 403 }
    );
  }

  const headers = new Headers();
  const forwardedHeaders = payload.headers ?? {};

  for (const [k, v] of Object.entries(forwardedHeaders)) {
    if (!v) continue;
    if (isHopByHopHeader(k)) continue;
    headers.set(k, v);
  }

  const contentType = payload.contentType;
  let body: BodyInit | undefined;
  if (payload.body !== undefined && method !== "GET" && method !== "HEAD") {
    if (typeof payload.body === "string") {
      body = payload.body;
      if (contentType) headers.set("content-type", contentType);
    } else {
      body = JSON.stringify(payload.body);
      headers.set("content-type", contentType ?? "application/json");
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55_000);

  let res: Response;
  try {
    res = await fetch(upstreamUrl, {
      method,
      headers,
      body,
      redirect: "manual",
      signal: controller.signal
    });
  } catch (e) {
    clearTimeout(timeoutId);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: `Upstream fetch failed: ${message}` }, { status: 502 });
  }
  clearTimeout(timeoutId);

  const responseHeaders = Object.fromEntries(res.headers.entries());
  const setCookie = getSetCookie(res.headers);

  let content: { bodyType: "json" | "text" | "base64"; body: unknown };
  try {
    content = await readBody(res);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: `Failed to read upstream response: ${message}` }, { status: 502 });
  }

  return NextResponse.json(
    {
      ok: true,
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      setCookie,
      ...content
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}

function normalizeMethod(method: string): string | null {
  const m = method.trim().toUpperCase();
  if (m === "GET" || m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE" || m === "HEAD" || m === "OPTIONS") {
    return m;
  }
  return null;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string>) {
  const base = new URL(baseUrl);
  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new Error("Invalid baseUrl protocol.");
  }

  base.hash = "";
  base.search = "";
  base.pathname = joinPath(base.pathname, path);

  const url = base;
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null) continue;
    if (String(v).length === 0) continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

function isAllowedHost(allowlist: Set<string>, upstreamUrl: string, strictMode: boolean) {
  const parsed = new URL(upstreamUrl);
  if (isProbablyLocalhostOrPrivate(parsed.hostname)) return false;
  if (!strictMode) return true;
  return allowlist.has(parsed.host);
}

function isHopByHopHeader(name: string) {
  const n = name.toLowerCase();
  return (
    n === "connection" ||
    n === "keep-alive" ||
    n === "proxy-authenticate" ||
    n === "proxy-authorization" ||
    n === "te" ||
    n === "trailer" ||
    n === "transfer-encoding" ||
    n === "upgrade" ||
    n === "host" ||
    n === "content-length"
  );
}

function isSafePath(path: string) {
  if (typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  if (path.includes("#") || path.includes("?")) return false;
  return true;
}

function joinPath(prefix: string, suffix: string) {
  const a = prefix === "/" ? "" : prefix.replace(/\/$/, "");
  const b = suffix.startsWith("/") ? suffix : `/${suffix}`;
  return `${a}${b}`;
}

function buildHostAllowlist(allowedHosts: string[] | undefined, baseUrl: string | undefined, doc: unknown) {
  const hosts = new Set<string>();

  for (const h of allowedHosts ?? []) {
    if (typeof h === "string" && h.trim()) hosts.add(h.trim());
  }

  if (typeof baseUrl === "string" && baseUrl.trim()) {
    try {
      const url = new URL(baseUrl);
      if (url.host) hosts.add(url.host);
    } catch {
      // ignore
    }
  }

  const servers = getDocServers(doc);
  if (Array.isArray(servers)) {
    for (const s of servers) {
      const url = isRecord(s) && typeof s["url"] === "string" ? s["url"] : null;
      if (!url) continue;
      try {
        const resolved = new URL(url);
        if (resolved.host) hosts.add(resolved.host);
      } catch {
        // relative server URLs are ignored for allowlisting
      }
    }
  }

  return hosts;
}

type HeadersWithSetCookie = Headers & { getSetCookie?: () => string[] };

function getSetCookie(headers: Headers): string[] | string | null {
  const maybe = headers as HeadersWithSetCookie;
  return maybe.getSetCookie?.() ?? headers.get("set-cookie");
}

function getDocServers(doc: unknown): unknown[] {
  if (!isRecord(doc)) return [];
  const servers = doc["servers"];
  return Array.isArray(servers) ? servers : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProbablyLocalhostOrPrivate(hostname: string) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0" || h === "127.0.0.1" || h === "::1") return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    const [a, b] = h.split(".").map((n) => Number(n));
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

async function readBody(res: Response): Promise<{ bodyType: "json" | "text" | "base64"; body: unknown }> {
  const contentType = res.headers.get("content-type") ?? "";

  const isTexty =
    contentType.includes("application/json") ||
    contentType.includes("+json") ||
    contentType.startsWith("text/") ||
    contentType.includes("application/xml") ||
    contentType.includes("application/yaml") ||
    contentType.includes("text/yaml");

  if (isTexty) {
    const text = await res.text();
    if (contentType.includes("json") || contentType.includes("+json")) {
      try {
        return { bodyType: "json", body: JSON.parse(text) as unknown };
      } catch {
        return { bodyType: "text", body: text };
      }
    }
    return { bodyType: "text", body: text };
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return { bodyType: "base64", body: buf.toString("base64") };
}
