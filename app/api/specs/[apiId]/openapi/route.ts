import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getApiConfigSafe } from "@/config/apis";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ apiId: string }> }
) {
  const { apiId } = await params;
  const api = await getApiConfigSafe(apiId);
  if (!api || api.source.kind !== "local") {
    return NextResponse.json({ error: "Spec não encontrada." }, { status: 404 });
  }

  let content: string;
  try {
    const absolute = path.join(process.cwd(), api.source.filePath);
    content = await readFile(absolute, "utf8");
  } catch {
    return NextResponse.json({ error: "Erro ao ler o arquivo de spec." }, { status: 500 });
  }

  const isYaml = /\.(ya?ml)$/i.test(api.source.filePath);
  const ext = isYaml ? "yaml" : "json";
  const contentType = isYaml ? "application/yaml" : "application/json";

  return new Response(content, {
    headers: {
      "content-type": `${contentType}; charset=utf-8`,
      "content-disposition": `attachment; filename="${apiId}-openapi.${ext}"`,
      "cache-control": "no-store"
    }
  });
}
