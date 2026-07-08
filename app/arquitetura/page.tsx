import type { Metadata } from "next";
import Link from "next/link";
import { ArchitectureSection } from "@/components/solution/architecture-section";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "A Solução — Componentes | IZII",
  description:
    "Entenda, de forma simples, as peças da solução IZII: nuvem flexível, Keycloak, KrakenD e Grafana."
};

export default function ArquiteturaPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      <div className="relative mx-auto max-w-6xl">
        <GradientRail side="left" />
        <GradientRail side="right" />

        <ArchitectureSection />
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
