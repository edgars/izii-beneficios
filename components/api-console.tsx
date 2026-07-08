"use client";

import * as React from "react";
import { Play, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { OperationDetails, OperationParameter } from "@/lib/openapi/operation-types";
import { cn } from "@/lib/utils";

type ProxyResponse =
  | {
      ok: true;
      status: number;
      statusText: string;
      headers: Record<string, string>;
      setCookie?: string[] | string | null;
      bodyType: "json" | "text" | "base64";
      body: unknown;
    }
  | {
      ok: false;
      error: string;
    };

export function ApiConsole({
  apiId,
  operation,
  defaultBaseUrl
}: {
  apiId: string;
  operation: OperationDetails;
  defaultBaseUrl: string;
}) {
  const [baseUrl, setBaseUrl] = React.useState(defaultBaseUrl);
  const [bearerToken, setBearerToken] = React.useState("");
  const [pathParams, setPathParams] = React.useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = React.useState<Record<string, string>>({});
  const [extraHeaders, setExtraHeaders] = React.useState<string>('{\n  "accept": "application/json"\n}');
  const [body, setBody] = React.useState<string>(() => initialBody(operation));
  const [response, setResponse] = React.useState<ProxyResponse | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    const key = `api-portal:bearer:${apiId}`;
    const saved = window.localStorage.getItem(key);
    if (saved) setBearerToken(saved);
  }, [apiId]);

  React.useEffect(() => {
    const key = `api-portal:bearer:${apiId}`;
    if (bearerToken) window.localStorage.setItem(key, bearerToken);
    else window.localStorage.removeItem(key);
  }, [apiId, bearerToken]);

  const pathParamDefs = operation.parameters.filter((p) => p.in === "path");
  const queryParamDefs = operation.parameters.filter((p) => p.in === "query");

  async function run() {
    setIsRunning(true);
    setResponse(null);
    try {
      const headers = parseJsonRecord(extraHeaders);
      const contentType = operation.requestBody?.contentType ?? "application/json";

      if (bearerToken) {
        headers.authorization = headers.authorization ?? `Bearer ${bearerToken}`;
      }

      const parsedBody = parseBody(body, contentType);

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiId,
          method: operation.method,
          path: fillPath(operation.path, pathParams),
          baseUrl,
          query: queryParams,
          headers,
          body: parsedBody,
          contentType
        })
      });

      const json = (await res.json()) as ProxyResponse;
      setResponse(json);
    } catch (e) {
      setResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setIsRunning(false);
    }
  }

  function reset() {
    setBaseUrl(defaultBaseUrl);
    setPathParams({});
    setQueryParams({});
    setExtraHeaders('{\n  "accept": "application/json"\n}');
    setBody(initialBody(operation));
    setResponse(null);
  }

  return (
    <div className="flex h-full flex-col gap-4 border-l bg-background p-5 xl:border-l">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold tracking-tight">Try it out</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={methodToBadge(operation.method)} className="uppercase">
              {operation.method}
            </Badge>
            <span className="truncate">{operation.path}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Reset" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button type="button" onClick={run} disabled={isRunning}>
            <Play className="h-4 w-4" />
            Executar
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="baseUrl">Base URL</Label>
          <Input
            id="baseUrl"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.suaempresa.com"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="token">Bearer Token</Label>
          <Input
            id="token"
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            placeholder="eyJhbGciOi..."
          />
        </div>
      </div>

      {(pathParamDefs.length > 0 || queryParamDefs.length > 0) && <Separator />}

      {pathParamDefs.length > 0 ? (
        <ParamSection
          title="Path Params"
          params={pathParamDefs}
          values={pathParams}
          onChange={setPathParams}
        />
      ) : null}

      {queryParamDefs.length > 0 ? (
        <ParamSection
          title="Query Params"
          params={queryParamDefs}
          values={queryParams}
          onChange={setQueryParams}
        />
      ) : null}

      <Separator />

      <Tabs defaultValue="body" className="min-h-0 flex-1">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="response" className="ml-auto">
            Response
          </TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="min-h-0">
          <div className="grid gap-1.5">
            <Label htmlFor="body">Payload ({operation.requestBody?.contentType ?? "application/json"})</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[180px] font-mono text-xs"
              placeholder="{ ... }"
            />
          </div>
        </TabsContent>

        <TabsContent value="headers" className="min-h-0">
          <div className="grid gap-1.5">
            <Label htmlFor="headers">Headers (JSON)</Label>
            <Textarea
              id="headers"
              value={extraHeaders}
              onChange={(e) => setExtraHeaders(e.target.value)}
              className="min-h-[180px] font-mono text-xs"
            />
          </div>
        </TabsContent>

        <TabsContent value="response" className="min-h-0">
          <ResponsePanel response={response} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ParamSection({
  title,
  params,
  values,
  onChange
}: {
  title: string;
  params: OperationParameter[];
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="grid gap-2">
        {params.map((p) => (
          <div key={`${p.in}:${p.name}`} className="grid gap-1.5">
            <Label htmlFor={`${title}:${p.name}`} className="flex items-center gap-2">
              <span>{p.name}</span>
              {p.required ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">required</span>
              ) : null}
            </Label>
            <Input
              id={`${title}:${p.name}`}
              value={values[p.name] ?? ""}
              onChange={(e) => onChange({ ...values, [p.name]: e.target.value })}
              placeholder={p.example !== undefined ? String(p.example) : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function ResponsePanel({ response }: { response: ProxyResponse | null }) {
  if (!response) {
    return (
      <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
        Execute uma request para ver a resposta aqui.
      </div>
    );
  }

  if (!response.ok) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {response.error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="font-medium text-foreground">
          HTTP {response.status} <span className="text-muted-foreground">{response.statusText}</span>
        </div>
        <div className="rounded border bg-muted px-2 py-1">{response.bodyType.toUpperCase()}</div>
      </div>
      <div className="rounded-md border bg-card p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Headers</div>
        <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(response.headers, null, 2)}</pre>
      </div>
      {response.setCookie ? (
        <div className="rounded-md border bg-card p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Set-Cookie</div>
          <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(response.setCookie, null, 2)}</pre>
        </div>
      ) : null}
      <div className="rounded-md border bg-card p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body</div>
        <pre className={cn("mt-2 overflow-auto text-xs", response.bodyType !== "base64" && "whitespace-pre-wrap")}>
          {response.bodyType === "json" ? JSON.stringify(response.body, null, 2) : String(response.body)}
        </pre>
      </div>
    </div>
  );
}

function methodToBadge(method: OperationDetails["method"]) {
  switch (method) {
    case "get":
      return "success";
    case "post":
      return "info";
    case "delete":
      return "destructive";
    case "put":
    case "patch":
      return "warning";
    default:
      return "secondary";
  }
}

function initialBody(operation: OperationDetails) {
  if (!operation.requestBody) return "";
  const example = operation.requestBody.example ?? operation.requestBody.schema;
  if (example === undefined) return "";
  try {
    return JSON.stringify(example, null, 2);
  } catch {
    return String(example);
  }
}

function fillPath(pathTemplate: string, params: Record<string, string>) {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_m, key: string) => encodeURIComponent(params[key] ?? `{${key}}`));
}

function parseJsonRecord(source: string): Record<string, string> {
  const trimmed = source.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Headers deve ser um JSON objeto (ex: {\"accept\":\"application/json\"}).");
  }

  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === "string") result[k.toLowerCase()] = v;
    else if (typeof v === "number" || typeof v === "boolean") result[k.toLowerCase()] = String(v);
  }
  return result;
}

function parseBody(bodyText: string, contentType: string) {
  const trimmed = bodyText.trim();
  if (!trimmed) return undefined;
  if (contentType.includes("application/json")) return JSON.parse(trimmed);
  return trimmed;
}
