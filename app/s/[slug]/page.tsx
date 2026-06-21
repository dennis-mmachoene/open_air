import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPublishedBySlug, hasLiked, LICENSES } from "@/lib/publish";
import { Strata } from "@/components/palette/Strata";
import { CopyHexList } from "@/components/community/CopyHexList";
import { LikeButton } from "@/components/community/LikeButton";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublishedBySlug(slug);
  if (!p) return { title: "Not found" };
  return { title: p.name, description: p.description ?? `A community palette by ${p.authorHandle ?? p.authorName ?? "Open Air"}.` };
}

export const dynamic = "force-dynamic";

export default async function PublishedPalettePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublishedBySlug(slug);
  if (!p) notFound();

  const session = await auth();
  const viewerId = session?.user?.id;
  // Private palettes are visible only to their author.
  if (p.visibility === "private" && viewerId !== p.authorId) notFound();

  const liked = viewerId ? await hasLiked(viewerId, p.id) : false;
  const license = LICENSES.find((l) => l.id === p.license)?.label ?? p.license;
  const author = p.authorHandle ? `@${p.authorHandle}` : (p.authorName ?? "Anonymous");

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12 sm:px-8">
      <Strata hexes={p.hexes} className="h-40" />

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-4xl text-text">{p.name}</h1>
            <p className="text-sm text-text-soft">
              by{" "}
              {p.authorHandle ? (
                <Link href={`/u/${p.authorHandle}`} className="text-text underline-offset-4 hover:underline">{author}</Link>
              ) : (
                <span className="text-text">{author}</span>
              )}
            </p>
          </div>
          <LikeButton id={p.id} initialLiked={liked} initialCount={p.likeCount} />
        </div>
        {p.description ? <p className="text-lg text-text-soft">{p.description}</p> : null}
      </header>

      <CopyHexList hexes={p.hexes} />

      {p.rationale ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-xl text-text">Why it works</h2>
          <p className="leading-relaxed text-text-soft">{p.rationale}</p>
        </section>
      ) : null}

      <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface p-5 text-sm sm:grid-cols-4">
        <div><dt className="text-text-muted">Accessibility</dt><dd className="text-text">{p.a11yScore}/100</dd></div>
        {p.harmony ? <div><dt className="text-text-muted">Harmony</dt><dd className="text-text">{p.harmony}</dd></div> : null}
        <div><dt className="text-text-muted">License</dt><dd className="text-text">{license}</dd></div>
        <div><dt className="text-text-muted">Colors</dt><dd className="text-text">{p.hexes.length}</dd></div>
      </dl>

      {p.tags.length ? (
        <div className="flex flex-wrap gap-2">
          {p.tags.map((t) => (
            <span key={t} className="rounded-full border border-border px-3 py-1 text-sm text-text-soft">{t}</span>
          ))}
        </div>
      ) : null}

      <p className="text-sm text-text-muted">
        <Link href="/explore" className="underline-offset-4 hover:underline">← Back to Explore</Link>
      </p>
    </article>
  );
}
