import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPublishedBySlug, hasLiked, LICENSES } from "@/lib/publish";
import { isBookmarked, listComments } from "@/lib/social";
import { Strata } from "@/components/palette/Strata";
import { CopyHexList } from "@/components/community/CopyHexList";
import { LikeButton } from "@/components/community/LikeButton";
import { BookmarkButton } from "@/components/community/BookmarkButton";
import { ReportButton } from "@/components/community/ReportButton";
import { Comments, type CommentView } from "@/components/community/Comments";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublishedBySlug(slug);
  if (!p) return { title: "Not found" };
  return { title: p.name, description: p.description ?? `A community palette by ${p.authorHandle ?? p.authorName ?? "Open Air"}.` };
}

export const dynamic = "force-dynamic";

// Licenses that permit a derivative work (remix).
const REMIXABLE = new Set(["attribution", "commercial", "public-domain"]);

export default async function PublishedPalettePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublishedBySlug(slug);
  if (!p) notFound();

  const session = await auth();
  const viewerId = session?.user?.id;
  // Private palettes are visible only to their author.
  if (p.visibility === "private" && viewerId !== p.authorId) notFound();

  const [liked, bookmarked, comments] = await Promise.all([
    viewerId ? hasLiked(viewerId, p.id) : Promise.resolve(false),
    viewerId ? isBookmarked(viewerId, p.id) : Promise.resolve(false),
    listComments(p.id),
  ]);
  const license = LICENSES.find((l) => l.id === p.license)?.label ?? p.license;
  const author = p.authorHandle ? `@${p.authorHandle}` : (p.authorName ?? "Anonymous");
  const canModerate = viewerId === p.authorId;
  const canRemix = REMIXABLE.has(p.license);
  const remixHref = `/publish?colors=${encodeURIComponent(p.hexes.join(","))}`;

  const initialComments: CommentView[] = comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    authorId: c.authorId,
    authorName: c.authorName,
    authorHandle: c.authorHandle,
    authorImage: c.authorImage,
  }));

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
          <div className="flex flex-wrap items-center gap-2">
            <LikeButton id={p.id} initialLiked={liked} initialCount={p.likeCount} />
            <BookmarkButton id={p.id} initialBookmarked={bookmarked} />
            {canRemix ? (
              <Link
                href={remixHref}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7" />
                </svg>
                Remix
              </Link>
            ) : null}
          </div>
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

      <Comments publishedId={p.id} initial={initialComments} canModerate={canModerate} />

      <div className="flex items-center justify-between">
        <Link href="/explore" className="text-sm text-text-muted underline-offset-4 hover:underline">← Back to Explore</Link>
        <ReportButton id={p.id} />
      </div>
    </article>
  );
}
