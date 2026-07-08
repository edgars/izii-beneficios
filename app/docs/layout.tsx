import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listGuides } from "@/lib/mdx/guides";

export const revalidate = 3600;

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const guides = await listGuides();

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Manuais de Usuário</p>
          <nav className="flex flex-col gap-1">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/docs/${guide.slug}`}
                className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-izii-charcoal"
              >
                {guide.title}
              </Link>
            ))}
          </nav>
        </aside>
        <article className="prose-portal min-w-0">{children}</article>
      </div>
    </div>
  );
}
