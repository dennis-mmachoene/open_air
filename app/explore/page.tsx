import type { Metadata } from "next";
import Link from "next/link";
import { listFeed, type FeedSort } from "@/lib/publish";
import { listFeatured } from "@/lib/social";
import { PublishedCard } from "@/components/community/PublishedCard";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Explore",
  description: "Discover community-published color palettes on Open Air — new releases, the most-loved, and staff picks.",
};
export const dynamic = "force-dynamic";

type Tab = "new" | "top" | "featured";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  const active: Tab = sort === "top" ? "top" : sort === "featured" ? "featured" : "new";
  const feed = active === "featured" ? await listFeatured(48) : await listFeed(active as FeedSort, 48);

  const tab = (id: Tab, label: string) => (
    <Link
      href={`/explore?sort=${id}`}
      className={active === id ? "rounded-pill bg-text px-3 py-1 text-canvas" : "rounded-pill px-3 py-1 text-text-soft hover:text-text"}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Community</p>
          <h1 className="font-display text-4xl text-text sm:text-5xl">Explore</h1>
          <p className="max-w-xl text-lg text-text-soft">Palettes published by the Open Air community.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-pill border border-border p-0.5 text-sm">
            {tab("new", "New")}
            {tab("top", "Top")}
            {tab("featured", "Staff picks")}
          </div>
          <Link href="/trends" className="rounded-pill px-3 py-1 text-sm text-text-soft transition-colors ease-standard hover:bg-surface-2 hover:text-text">Trends</Link>
          <Link href="/bookmarks" className="rounded-pill px-3 py-1 text-sm text-text-soft transition-colors ease-standard hover:bg-surface-2 hover:text-text">Saved</Link>
          <Link href="/publish" className="rounded-pill bg-text px-4 py-1.5 text-sm font-medium text-canvas transition-opacity ease-standard hover:opacity-90">Publish</Link>
        </div>
      </header>

      {feed.length === 0 ? (
        active === "featured" ? (
          <EmptyState title="No staff picks yet" description="Our favorites will appear here soon — check back." />
        ) : (
          <EmptyState
            title="Nothing published yet"
            description="Be the first to share a palette with the community."
            action={<Link href="/publish" className="text-sm text-text underline-offset-4 hover:underline">Publish a palette →</Link>}
          />
        )
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {feed.map((p) => (
            <PublishedCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
