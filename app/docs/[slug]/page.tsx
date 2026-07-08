import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { getGuide, listGuides } from "@/lib/mdx/guides";

export const revalidate = 3600;

export async function generateStaticParams() {
  const guides = await listGuides();
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return {};
  return { title: `${guide.title} — API Portal`, description: guide.description };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();

  return (
    <div>
      <header className="mb-8 border-b border-slate-200 pb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-izii-lime">Manual de Usuário</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-izii-charcoal">{guide.title}</h1>
        {guide.description ? <p className="mt-2 text-slate-500">{guide.description}</p> : null}
      </header>
      <MDXRemote
        source={guide.content}
        components={mdxComponents}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </div>
  );
}
