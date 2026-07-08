import { ApiPremiumSelector } from "@/components/home/api-premium-selector";
import { HeroSection } from "@/components/home/hero-section";
import { SiteHeader } from "@/components/site-header";
import { listApis } from "@/config/apis";
import { getOpenApiDocument } from "@/lib/openapi";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 3600;

export default async function HomePage() {
  const apis = await listApis();

  const apisWithMeta = await Promise.all(
    apis.map(async (api) => {
      try {
        const doc = await getOpenApiDocument(api.id);
        const info = doc.info as { title?: string; description?: string; version?: string } | undefined;
        return {
          ...api,
          name: info?.title ?? api.name,
          description: api.description ?? info?.description,
          badge: info?.version ? `v${info.version}` : undefined,
          tagline: info?.description
        };
      } catch {
        return api;
      }
    })
  );

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      {/* Bloco principal emoldurado por rails verticais com degradê azul claro,
          alinhado à largura do header (max-w-6xl). */}
      <div className="relative mx-auto max-w-6xl">
        <GradientRail side="left" />
        <GradientRail side="right" />

        <HeroSection />

        <GradientDivider />

        <section id="apis">
          <ApiPremiumSelector apis={apisWithMeta} />
        </section>
      </div>

      <GradientDivider />

      <footer className="px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 text-center text-xs text-slate-500">
          <Link href="/docs/referencia-rest" className="text-izii-lime hover:underline">
            Ver documentação
          </Link>
          <span>·</span>
          <span>IZII APIs Platform</span>
        </div>
      </footer>
    </div>
  );
}

/** Linha horizontal com degradê azul claro — separa seções de ponta a ponta. */
function GradientDivider() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />;
}

/** Rail vertical com degradê azul claro — delimita as bordas esquerda/direita. */
function GradientRail({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-sky-300/70 to-transparent",
        side === "left" ? "left-0" : "right-0"
      )}
    />
  );
}
