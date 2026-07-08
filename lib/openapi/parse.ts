import "server-only";

import { bundle, createConfig } from "@redocly/openapi-core";
import { parse as parseYaml } from "yaml";
import type { OpenApiDocument } from "@/lib/openapi/types";

export async function parseOpenApiDocument(source: string, hint: string): Promise<OpenApiDocument> {
  const trimmed = source.trimStart().replace(/^\uFEFF/, "");
  const looksLikeJson =
    hint.toLowerCase().endsWith(".json") || trimmed.startsWith("{") || trimmed.startsWith("[");

  const yamlSource = looksLikeJson ? trimmed : normalizeYamlIndent(trimmed);
  const parsed = looksLikeJson ? JSON.parse(trimmed) : parseYaml(yamlSource);

  try {
    const config = await createConfig({});
    const result = await bundle({ ref: parsed, config });
    return (result.bundle.parsed ?? parsed) as OpenApiDocument;
  } catch {
    return parsed as OpenApiDocument;
  }
}

/** Remove indentação uniforme extra (ex.: spec salva com 2 espaços na raiz). */
function normalizeYamlIndent(source: string): string {
  const lines = source.split(/\r?\n/);
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const match = line.match(/^(\s+)/);
      return match ? match[1].length : 0;
    });

  if (indents.length === 0) return source;

  const minIndent = Math.min(...indents);
  if (minIndent === 0) return source;

  return lines
    .map((line) => {
      if (line.trim().length === 0) return line;
      if (line.length >= minIndent && line.slice(0, minIndent).trim() === "") {
        return line.slice(minIndent);
      }
      return line;
    })
    .join("\n");
}
