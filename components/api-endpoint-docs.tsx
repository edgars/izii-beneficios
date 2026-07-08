"use client";

import { motion } from "framer-motion";
import type { SchemaField } from "@/lib/openapi/resolve-schema";
import type { OperationDetails, OperationParameter } from "@/lib/openapi/operation-types";
import { MotionHighlight } from "@/components/motion/motion-highlight";
import { PageEnter, PageEnterItem } from "@/components/motion/page-enter";
import { SchemaTree } from "@/components/openapi/schema-tree";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ParamWithType = OperationParameter & { resolvedType?: string };

export function ApiEndpointDocs({
  operation,
  requestSchema,
  responseSchemas
}: {
  operation: OperationDetails & { parameters: ParamWithType[] };
  requestSchema?: SchemaField | null;
  responseSchemas?: { status: string; schema: SchemaField | null }[];
}) {
  const pathParams = operation.parameters.filter((p) => p.in === "path");
  const queryParams = operation.parameters.filter((p) => p.in === "query");
  const headerParams = operation.parameters.filter((p) => p.in === "header");

  const docKey = `${operation.method}:${operation.path}`;

  return (
    <PageEnter key={docKey} className="space-y-6 p-6">
      <PageEnterItem>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={methodToBadge(operation.method)} className="uppercase">
            {operation.method}
          </Badge>
          {operation.deprecated ? (
            <Badge variant="outline" className="border-amber-500/40 text-amber-400">
              Deprecated
            </Badge>
          ) : null}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-izii-charcoal">
          {operation.summary ?? operation.path}
        </h1>
        <motion.code
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, type: "spring", stiffness: 320, damping: 28 }}
          className="block rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-izii-green shadow-sm"
        >
          {operation.path}
        </motion.code>
        {operation.description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{operation.description}</p>
        ) : null}
      </header>
      </PageEnterItem>

      <Separator className="bg-slate-200" />

      {pathParams.length > 0 ? <ParamCards title="Path Parameters" params={pathParams} /> : null}
      {queryParams.length > 0 ? <ParamCards title="Query Parameters" params={queryParams} /> : null}
      {headerParams.length > 0 ? <ParamCards title="Headers" params={headerParams} /> : null}

      {operation.requestBody ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Request Body</h2>
          <MotionHighlight className="border-glow">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">
                {operation.requestBody.contentType ?? "application/json"}
                {operation.requestBody.required ? (
                  <span className="ml-2 text-xs text-rose-400">required</span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {requestSchema ? <SchemaTree field={requestSchema} /> : null}
              <SchemaPreview value={operation.requestBody.example ?? operation.requestBody.schema} />
            </CardContent>
          </Card>
          </MotionHighlight>
        </section>
      ) : null}

      {operation.responses.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Responses</h2>
          <div className="grid gap-3">
            {operation.responses.map((resp) => {
              const resolved = responseSchemas?.find((r) => r.status === resp.status)?.schema;
              return (
                <MotionHighlight key={resp.status} delay={0.05} className="border-slate-200">
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          resp.status.startsWith("2") ? "success" : resp.status.startsWith("4") ? "warning" : "secondary"
                        }
                      >
                        {resp.status}
                      </Badge>
                      <CardDescription>{resp.description ?? "—"}</CardDescription>
                    </div>
                  </CardHeader>
                  {resolved || resp.example !== undefined || resp.schema !== undefined ? (
                    <CardContent className="space-y-4">
                      {resolved ? <SchemaTree field={resolved} /> : null}
                      <SchemaPreview value={resp.example ?? resp.schema} />
                    </CardContent>
                  ) : null}
                </Card>
                </MotionHighlight>
              );
            })}
          </div>
        </section>
      ) : null}
    </PageEnter>
  );
}

function ParamCards({ title, params }: { title: string; params: ParamWithType[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {params.map((p, i) => (
          <MotionHighlight key={`${p.in}:${p.name}`} delay={i * 0.04} className="border-slate-200">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 font-mono text-sm text-slate-800">
                {p.name}
                {p.resolvedType ? (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-sans uppercase text-slate-500">
                    {p.resolvedType}
                  </span>
                ) : null}
                {p.required ? (
                  <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-sans text-rose-400">
                    required
                  </span>
                ) : null}
              </CardTitle>
              {p.description ? <CardDescription>{p.description}</CardDescription> : null}
            </CardHeader>
            {p.example !== undefined ? (
              <CardContent className="pt-0">
                <code className="text-xs text-slate-500">ex: {String(p.example)}</code>
              </CardContent>
            ) : null}
          </Card>
          </MotionHighlight>
        ))}
      </div>
    </section>
  );
}

function SchemaPreview({ value }: { value: unknown }) {
  if (value === undefined) return null;
  let text: string;
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  if (text === "{}" || text === '{"$ref":' || (text.includes('"$ref"') && text.length < 120)) return null;
  return (
    <details className="group">
      <summary className="cursor-pointer text-xs text-slate-500 transition hover:text-slate-700">
        Ver schema bruto / exemplo JSON
      </summary>
      <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-[#0a0a0c] p-4 font-mono text-xs text-zinc-300">
        {text}
      </pre>
    </details>
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
