import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

export type GuideMeta = {
  slug: string;
  title: string;
  description: string;
  order: number;
};

export type Guide = GuideMeta & {
  content: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content/guides");

export const GUIDE_SLUGS = ["referencia-rest", "orquestrador-izzi", "postman-orquestrador"] as const;
export type GuideSlug = (typeof GUIDE_SLUGS)[number];

export const listGuides = cache(async (): Promise<GuideMeta[]> => {
  const guides: GuideMeta[] = [];

  for (const slug of GUIDE_SLUGS) {
    const guide = await getGuideMeta(slug);
    if (guide) guides.push(guide);
  }

  return guides.sort((a, b) => a.order - b.order);
});

export const getGuide = cache(async (slug: string): Promise<Guide | null> => {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return null;
  }

  const { content } = matter(raw);
  const meta = await getGuideMeta(slug);
  if (!meta) return null;

  return { ...meta, content };
});

async function getGuideMeta(slug: string): Promise<GuideMeta | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return null;
  }

  const { data } = matter(raw);
  const title = typeof data.title === "string" ? data.title : slug;
  const description = typeof data.description === "string" ? data.description : "";
  const order = typeof data.order === "number" ? data.order : 99;

  return { slug, title, description, order };
}

export async function listGuideFiles(): Promise<string[]> {
  try {
    const entries = await readdir(CONTENT_DIR);
    return entries.filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
  } catch {
    return [];
  }
}
