import { NextResponse } from "next/server";
import { getApiConfigSafe } from "@/config/apis";
import { getOpenApiDocument } from "@/lib/openapi";
import { openApiToPostman } from "@/lib/openapi-to-postman";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ apiId: string }> }
) {
  const { apiId } = await params;
  const api = await getApiConfigSafe(apiId);
  if (!api) {
    return NextResponse.json({ error: "API não encontrada." }, { status: 404 });
  }

  let collection: unknown;
  try {
    const doc = await getOpenApiDocument(apiId);
    collection = openApiToPostman(doc, api.baseUrl);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Falha ao gerar coleção: ${message}` }, { status: 500 });
  }

  return new Response(JSON.stringify(collection, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${apiId}-restful.postman_collection.json"`,
      "cache-control": "no-store"
    }
  });
}
