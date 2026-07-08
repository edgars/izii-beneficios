"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Eye, EyeOff, Play, RotateCcw, Terminal } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JsonEditor } from "@/components/json-editor";
import { buildCodeSnippet, type SnippetLanguage } from "@/lib/code-snippets";
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
  | { ok: false; error: string };

type LastRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
};

const SNIPPET_TABS: { id: SnippetLanguage; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" }
];

function isAuthTokenPath(path: string) {
  return path.endsWith("/v1/auth/token");
}

const STORAGE_KEYS = {
  bearer: (apiId: string) => `api-portal:bearer:${apiId}`,
  bearerExp: (apiId: string) => `api-portal:bearer-exp:${apiId}`,
  baseUrl: (apiId: string) => `api-portal:base-url:${apiId}`
};

function useSavedFlash() {
  const [saved, setSaved] = React.useState(false);
  const flash = React.useCallback(() => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }, []);
  return [saved, flash] as const;
}

function extractToken(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  for (const key of ["access_token", "token", "accessToken", "id_token"]) {
    if (typeof b[key] === "string" && (b[key] as string).length > 0) return b[key] as string;
  }
  return null;
}

function decodeJwtExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const pad = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(pad)) as Record<string, unknown>;
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return "Expirado";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function buildRequestUrl(
  baseUrl: string,
  pathTemplate: string,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>
): string {
  const base = baseUrl.replace(/\/$/, "");
  const path = fillPath(pathTemplate, pathParams);
  const full = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  const qs = new URLSearchParams(Object.entries(queryParams).filter(([, v]) => v)).toString();
  return qs ? `${full}?${qs}` : full;
}

export function ApiConsolePlayground({
  apiId,
  operation,
  defaultBaseUrl
}: {
  apiId: string;
  operation: OperationDetails;
  defaultBaseUrl: string;
}) {
  const isAuthEndpoint = isAuthTokenPath(operation.path);

  const [baseUrl, setBaseUrl] = React.useState(defaultBaseUrl);
  const [bearerToken, setBearerToken] = React.useState("");
  const [showToken, setShowToken] = React.useState(false);
  const [baseUrlSaved, flashBaseUrlSaved] = useSavedFlash();
  const [bearerSaved, flashBearerSaved] = useSavedFlash();
  const [tokenExpiry, setTokenExpiry] = React.useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);
  const [pathParams, setPathParams] = React.useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = React.useState<Record<string, string>>({});
  const [headerParams, setHeaderParams] = React.useState<Record<string, string>>({});
  const [body, setBody] = React.useState(() => initialBody(operation));
  const [response, setResponse] = React.useState<ProxyResponse | null>(null);
  const [lastRequest, setLastRequest] = React.useState<LastRequest | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [snippetLang, setSnippetLang] = React.useState<SnippetLanguage>("curl");
  const [mainTab, setMainTab] = React.useState<"try" | "code">("try");

  // Load saved token + expiry + baseUrl on mount / api change
  React.useEffect(() => {
    const token = window.localStorage.getItem(STORAGE_KEYS.bearer(apiId));
    if (token) setBearerToken(token);
    else setBearerToken("");
    const expRaw = window.localStorage.getItem(STORAGE_KEYS.bearerExp(apiId));
    if (expRaw) {
      const exp = parseInt(expRaw, 10);
      if (!isNaN(exp)) setTokenExpiry(exp);
    } else {
      setTokenExpiry(null);
    }
    const savedBaseUrl = window.localStorage.getItem(STORAGE_KEYS.baseUrl(apiId));
    if (savedBaseUrl) setBaseUrl(savedBaseUrl);
  }, [apiId]);

  // Persist bearer token on change (debounced by React batching)
  React.useEffect(() => {
    if (bearerToken) window.localStorage.setItem(STORAGE_KEYS.bearer(apiId), bearerToken);
    else window.localStorage.removeItem(STORAGE_KEYS.bearer(apiId));
  }, [apiId, bearerToken]);

  // Persist Base URL on change
  React.useEffect(() => {
    if (baseUrl && baseUrl !== defaultBaseUrl) {
      window.localStorage.setItem(STORAGE_KEYS.baseUrl(apiId), baseUrl);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.baseUrl(apiId));
    }
  }, [apiId, baseUrl, defaultBaseUrl]);

  // Extract + save token when auth endpoint responds
  React.useEffect(() => {
    if (!isAuthEndpoint || !response || !response.ok) return;
    const token = extractToken(response.body);
    if (!token) return;
    window.localStorage.setItem(STORAGE_KEYS.bearer(apiId), token);
    setBearerToken(token);
    flashBearerSaved();
    const exp = decodeJwtExpiry(token);
    if (exp) {
      window.localStorage.setItem(STORAGE_KEYS.bearerExp(apiId), String(exp));
      setTokenExpiry(exp);
    }
  }, [apiId, isAuthEndpoint, response, flashBearerSaved]);

  const commitBaseUrl = React.useCallback(
    (value: string) => {
      const trimmed = value.trim();
      setBaseUrl(trimmed);
      if (trimmed && trimmed !== defaultBaseUrl) {
        window.localStorage.setItem(STORAGE_KEYS.baseUrl(apiId), trimmed);
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.baseUrl(apiId));
      }
      flashBaseUrlSaved();
    },
    [apiId, defaultBaseUrl, flashBaseUrlSaved]
  );

  const commitBearerToken = React.useCallback(
    (value: string) => {
      const trimmed = value.trim();
      setBearerToken(trimmed);
      if (trimmed) {
        window.localStorage.setItem(STORAGE_KEYS.bearer(apiId), trimmed);
        const exp = decodeJwtExpiry(trimmed);
        if (exp) {
          window.localStorage.setItem(STORAGE_KEYS.bearerExp(apiId), String(exp));
          setTokenExpiry(exp);
        }
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.bearer(apiId));
        window.localStorage.removeItem(STORAGE_KEYS.bearerExp(apiId));
        setTokenExpiry(null);
      }
      flashBearerSaved();
    },
    [apiId, flashBearerSaved]
  );

  // Countdown timer
  React.useEffect(() => {
    if (!tokenExpiry) { setSecondsLeft(null); return; }
    const tick = () => setSecondsLeft(Math.max(0, tokenExpiry - Math.floor(Date.now() / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [tokenExpiry]);

  const pathParamDefs = operation.parameters.filter((p) => p.in === "path");
  const queryParamDefs = operation.parameters.filter((p) => p.in === "query");
  const headerParamDefs = operation.parameters.filter((p) => p.in === "header");
  const snippet = buildCodeSnippet(snippetLang, operation, baseUrl, pathParams, queryParams, body);

  async function run() {
    setIsRunning(true);
    setResponse(null);

    const headers: Record<string, string> = { accept: "application/json" };
    const contentType = operation.requestBody?.contentType ?? "application/json";
    if (!isAuthEndpoint && bearerToken) headers.authorization = `Bearer ${bearerToken}`;
    // headers declarados na spec (ex. X-Cnpj-Provedor)
    for (const p of headerParamDefs) {
      const v = headerParams[p.name];
      if (v != null && v !== "") headers[p.name] = v;
    }

    const url = buildRequestUrl(baseUrl, operation.path, pathParams, queryParams);
    setLastRequest({ url, method: operation.method.toUpperCase(), headers });

    try {
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

      let json: ProxyResponse;
      try {
        json = (await res.json()) as ProxyResponse;
      } catch {
        json = { ok: false, error: `Proxy returned HTTP ${res.status} with non-JSON body.` };
      }
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
    setBody(initialBody(operation));
    setResponse(null);
    setLastRequest(null);
    window.localStorage.removeItem(STORAGE_KEYS.baseUrl(apiId));
  }

  const tokenColor =
    secondsLeft === null ? "text-slate-400"
    : secondsLeft <= 0 ? "text-rose-500"
    : secondsLeft < 60 ? "text-rose-400"
    : secondsLeft < 300 ? "text-amber-500"
    : "text-emerald-500";

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-full min-w-0 flex-col"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-izii-charcoal">Console</p>
          <div className="flex items-center gap-2">
            <Badge variant={methodToBadge(operation.method)} className="uppercase text-[10px]">
              {operation.method}
            </Badge>
            <span className="truncate font-mono text-xs text-slate-500">{operation.path}</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button type="button" variant="ghost" size="icon" onClick={reset} className="h-8 w-8 text-slate-600">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              type="button"
              size="sm"
              onClick={run}
              disabled={isRunning}
              className="gap-1.5 bg-primary text-primary-foreground shadow-[0_0_24px_-6px_rgba(51,190,242,0.55)] hover:bg-primary/90"
            >
              <Play className="h-3.5 w-3.5" />
              {isRunning ? "Enviando…" : "Executar"}
            </Button>
          </motion.div>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "try" | "code")} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2 bg-slate-100">
          <TabsTrigger value="try">Try It Out</TabsTrigger>
          <TabsTrigger value="code">Snippets</TabsTrigger>
        </TabsList>

        <TabsContent value="try" className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <ScrollArea className="flex-1">
            <div className="space-y-4 px-4 py-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs text-slate-500">Base URL</Label>
                  <SavedIndicator visible={baseUrlSaved} />
                </div>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitBaseUrl(e.currentTarget.value);
                      e.currentTarget.blur();
                    }
                  }}
                  onBlur={(e) => commitBaseUrl(e.currentTarget.value)}
                  placeholder="https://api.exemplo.com"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full border-slate-200 bg-white font-mono text-xs text-izii-charcoal placeholder:text-slate-400 focus:ring-izii-green/30"
                />
              </div>

              {!isAuthEndpoint && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-500">Bearer Token</Label>
                    <div className="flex items-center gap-2">
                      <SavedIndicator visible={bearerSaved} />
                      {secondsLeft !== null && (
                        <span className={cn("text-[10px] font-medium tabular-nums", tokenColor)}>
                          {secondsLeft > 0 ? `expira em ${formatTimeLeft(secondsLeft)}` : "Token expirado"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitBearerToken(e.currentTarget.value);
                          e.currentTarget.blur();
                        }
                      }}
                      onBlur={(e) => commitBearerToken(e.currentTarget.value)}
                      placeholder="eyJhbGciOi…"
                      name="api-portal-bearer"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-1p-ignore
                      data-lpignore="true"
                      className="w-full border-slate-200 bg-white pr-9 font-mono text-xs text-izii-charcoal placeholder:text-slate-400 focus:ring-izii-green/30"
                    />
                    {bearerToken && (
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        aria-label={showToken ? "Ocultar token" : "Mostrar token"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-slate-600"
                      >
                        {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {headerParamDefs.length > 0 ? (
                <ParamFields title="Headers" params={headerParamDefs} values={headerParams} onChange={setHeaderParams} />
              ) : null}
              {pathParamDefs.length > 0 ? (
                <ParamFields title="Path" params={pathParamDefs} values={pathParams} onChange={setPathParams} />
              ) : null}
              {queryParamDefs.length > 0 ? (
                <ParamFields title="Query" params={queryParamDefs} values={queryParams} onChange={setQueryParams} />
              ) : null}
              <Separator className="bg-slate-200" />
              <Field label={`Body (${operation.requestBody?.contentType ?? "application/json"})`}>
                <JsonEditor value={body} onChange={setBody} placeholder="{ ... }" />
              </Field>
              <Field label="Response">
                <ResponseView
                  response={response}
                  lastRequest={lastRequest}
                  isRunning={isRunning}
                  isAuthEndpoint={isAuthEndpoint}
                  secondsLeft={secondsLeft}
                  tokenColor={tokenColor}
                />
              </Field>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="code" className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <div className="flex gap-1 border-b border-slate-200 px-4 py-2">
            {SNIPPET_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSnippetLang(tab.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  snippetLang === tab.id ? "bg-izii-lime/20 text-izii-green" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <ScrollArea className="flex-1 p-4">
            <CodeBlock code={snippet} language={snippetLang} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ─── Raw inspector ────────────────────────────────────────────────────────────

function buildRawSource(req: LastRequest, res: ProxyResponse & { ok: true }): string {
  const reqLines = [
    `> ${req.method} ${req.url} HTTP/1.1`,
    ...Object.entries(req.headers).map(([k, v]) => `> ${k}: ${v}`)
  ];

  const resLines = [
    `< HTTP/1.1 ${res.status} ${res.statusText}`,
    ...Object.entries(res.headers).map(([k, v]) => `< ${k}: ${v}`)
  ];

  const body =
    res.bodyType === "json"
      ? JSON.stringify(res.body, null, 2)
      : res.bodyType === "base64"
        ? `[base64 binary — ${String(res.body).length} chars]`
        : String(res.body);

  return [...reqLines, "", ...resLines, "", body].join("\n");
}

function RawInspector({ req, res }: { req: LastRequest; res: ProxyResponse & { ok: true } }) {
  const [open, setOpen] = React.useState(false);
  const source = React.useMemo(() => buildRawSource(req, res), [req, res]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-1.5 rounded-md border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-left text-[11px] font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200",
            open && "rounded-b-none border-b-0"
          )}
        >
          <Terminal className="h-3 w-3 shrink-0" />
          <span className="flex-1">Raw response</span>
          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-b-md border border-t-0 border-zinc-700/60 bg-[#0a0a0c]">
          <CodeBlock
            code={source}
            language="bash"
            collapsible={false}
            showLineNumbers={false}
            wrap={true}
            className="rounded-t-none border-0"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Response view ────────────────────────────────────────────────────────────

function ResponseView({
  response,
  lastRequest,
  isRunning,
  isAuthEndpoint,
  secondsLeft,
  tokenColor
}: {
  response: ProxyResponse | null;
  lastRequest: LastRequest | null;
  isRunning: boolean;
  isAuthEndpoint: boolean;
  secondsLeft: number | null;
  tokenColor: string;
}) {
  if (isRunning) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </motion.div>
    );
  }

  if (!response) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400"
      >
        Execute uma request para ver a resposta aqui.
      </motion.div>
    );
  }

  if (!response.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600"
      >
        {response.error}
      </motion.div>
    );
  }

  if (isAuthEndpoint && response.status < 400) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="auth-success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-600">Token gerado</span>
              <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                HTTP {response.status}
              </span>
            </div>
            {secondsLeft !== null && (
              <p className={cn("text-xs tabular-nums", tokenColor)}>
                {secondsLeft > 0
                  ? `Expira em ${formatTimeLeft(secondsLeft)}`
                  : "Token expirado — execute novamente para renovar"}
              </p>
            )}
          </div>
          {lastRequest && <RawInspector req={lastRequest} res={response} />}
        </motion.div>
      </AnimatePresence>
    );
  }

  const bodyText =
    response.bodyType === "json" ? JSON.stringify(response.body, null, 2) : String(response.body);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={response.status} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-[#0a0a0c]">
          <div className="flex items-center justify-between border-b border-slate-700/60 px-3 py-2">
            <span className={cn("text-xs font-medium", response.status < 400 ? "text-emerald-400" : "text-amber-400")}>
              HTTP {response.status} {response.statusText}
            </span>
            <span className="text-[10px] uppercase text-slate-500">{response.bodyType}</span>
          </div>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-xs leading-relaxed text-zinc-300">
            {bodyText}
          </pre>
        </div>
        {lastRequest && <RawInspector req={lastRequest} res={response} />}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-500">{label}</Label>
      {children}
    </div>
  );
}

function SavedIndicator({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.span
          key="saved"
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.18 }}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500"
        >
          <Check className="h-3 w-3" aria-hidden />
          Salvo
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

function ParamFields({
  title,
  params,
  values,
  onChange
}: {
  title: string;
  params: OperationParameter[];
  values: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      {params.map((p) => (
        <Field key={`${p.in}:${p.name}`} label={p.name + (p.required ? " *" : "")}>
          <Input
            value={values[p.name] ?? ""}
            onChange={(e) => onChange({ ...values, [p.name]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            placeholder={p.example !== undefined ? String(p.example) : undefined}
            spellCheck={false}
            autoComplete="off"
            className="w-full border-slate-200 bg-white font-mono text-xs text-izii-charcoal placeholder:text-slate-400 focus:ring-izii-green/30"
          />
        </Field>
      ))}
    </section>
  );
}

function methodToBadge(method: OperationDetails["method"]) {
  switch (method) {
    case "get": return "success";
    case "post": return "info";
    case "delete": return "destructive";
    case "put":
    case "patch": return "warning";
    default: return "secondary";
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

function parseBody(bodyText: string, contentType: string) {
  const trimmed = bodyText.trim();
  if (!trimmed) return undefined;
  if (contentType.includes("application/json")) return JSON.parse(trimmed);
  return trimmed;
}
