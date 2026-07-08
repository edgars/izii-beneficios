import type { OperationDetails } from "@/lib/openapi/operation-types";

export type SnippetLanguage = "curl" | "javascript" | "python";

export function buildCodeSnippet(
  language: SnippetLanguage,
  operation: OperationDetails,
  baseUrl: string,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>,
  body?: string
): string {
  const path = fillPath(operation.path, pathParams);
  const url = joinUrl(baseUrl, path, queryParams);
  const method = operation.method.toUpperCase();
  const hasBody = body && body.trim().length > 0 && method !== "GET" && method !== "HEAD";

  switch (language) {
    case "curl":
      return buildCurl(method, url, hasBody ? body : undefined);
    case "javascript":
      return buildJavaScript(method, url, hasBody ? body : undefined);
    case "python":
      return buildPython(method, url, hasBody ? body : undefined);
  }
}

function buildCurl(method: string, url: string, body?: string) {
  const lines = [`curl -X ${method} "${url}"`, `  -H "Accept: application/json"`];
  if (body) {
    lines.push(`  -H "Content-Type: application/json"`);
    lines.push(`  -d '${body.replace(/'/g, "'\\''")}'`);
  }
  return lines.join(" \\\n");
}

function buildJavaScript(method: string, url: string, body?: string) {
  const init: string[] = [`  method: "${method}"`, `  headers: { Accept: "application/json" }`];
  if (body) {
    init.push(`  headers: { ...headers, "Content-Type": "application/json" }`);
    init.push(`  body: JSON.stringify(${body})`);
  }
  return `const response = await fetch("${url}", {\n${init.join(",\n")}\n});\n\nconst data = await response.json();\nconsole.log(data);`;
}

function buildPython(method: string, url: string, body?: string) {
  const lines = [
    "import requests",
    "",
    `response = requests.${method.toLowerCase()}(`,
    `    "${url}",`,
    `    headers={"Accept": "application/json"},`
  ];
  if (body) {
    lines.push(`    json=${body},`);
  }
  lines.push(")");
  lines.push("print(response.json())");
  return lines.join("\n");
}

function fillPath(pathTemplate: string, params: Record<string, string>) {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_m, key: string) => encodeURIComponent(params[key] ?? `{${key}}`));
}

function joinUrl(baseUrl: string, path: string, query: Record<string, string>) {
  const base = baseUrl.replace(/\/$/, "");
  const full = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v) params.set(k, v);
  }
  const queryString = params.toString();

  try {
    const url = new URL(full);
    params.forEach((v, k) => url.searchParams.set(k, v));
    return url.toString();
  } catch {
    // baseUrl may be incomplete while the user is still typing it
    return queryString ? `${full}${full.includes("?") ? "&" : "?"}${queryString}` : full;
  }
}
