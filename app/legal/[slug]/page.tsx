import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LEGAL_DOCS, getLegalDoc, renderLegal } from "@/lib/legal";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal-meta";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return { title: "Not found" };
  return { title: doc.title, description: doc.summary };
}

export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();
  const html = renderLegal(slug);

  return (
    <article className="flex flex-col gap-6">
      <nav className="text-sm">
        <Link href="/legal" className="text-text-muted underline-offset-4 hover:underline">
          ← All policies
        </Link>
      </nav>
      <header className="flex flex-col gap-1 border-b border-border pb-6">
        <h1 className="font-display text-4xl text-text">{doc.title}</h1>
        <p className="text-sm text-text-muted">
          Effective {LEGAL_EFFECTIVE_DATE} · Open Air, operated by Dennis Ramara
        </p>
      </header>
      <div className="legal-prose" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
