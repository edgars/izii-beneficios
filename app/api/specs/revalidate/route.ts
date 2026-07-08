import { NextResponse } from "next/server";
import { getApiConfigSafe } from "@/config/apis";
import { apiSpecTag, revalidateApiSpec } from "@/lib/openapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = { apiId: string };

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (secret) {
    const provided = request.headers.get("x-revalidate-secret");
    if (provided !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const api = await getApiConfigSafe(body.apiId);
  if (!api) return NextResponse.json({ ok: false, error: "Unknown apiId." }, { status: 400 });

  revalidateApiSpec(body.apiId);
  return NextResponse.json({ ok: true, revalidated: true, tag: apiSpecTag(body.apiId) });
}

