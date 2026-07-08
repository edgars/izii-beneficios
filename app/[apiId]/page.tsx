import { notFound, redirect } from "next/navigation";
import { getApiConfigSafe } from "@/config/apis";
import { getOpenApiDocument, getOpenApiNav } from "@/lib/openapi";

export const revalidate = 3600;

export default async function ApiHomePage({
  params
}: {
  params: Promise<{ apiId: string }>;
}) {
  const { apiId } = await params;
  const api = await getApiConfigSafe(apiId);
  if (!api) notFound();

  const doc = await getOpenApiDocument(apiId);
  const nav = getOpenApiNav(doc);
  const first = nav.tags[0]?.operations[0];
  if (first) redirect(`/${apiId}/${first.id}`);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{api.name}</h1>
      {api.description ? (
        <p className="mt-2 text-sm text-muted-foreground">{api.description}</p>
      ) : null}
      <div className="mt-8 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Nenhum endpoint encontrado no spec.
      </div>
    </div>
  );
}
