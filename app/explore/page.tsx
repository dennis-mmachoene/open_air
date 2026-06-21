import type { Metadata } from "next";
import Link from "next/link";
import { listFeed, type FeedSort } from "@/lib/publish";
import { PublishedCard } from "@/components/community/PublishedCard";

export const metadata: Metadata = {
  title: "Explore",
  description: "Discover community-published color palettes on Open Air — new releases and the most-loved.",
};
export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  const active: FeedSort = sort === "top" ? "top" : "new";
  const feed = await listFeed(active, 48);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Community</p>
          <h1 className="font-display text-4xl text-text sm:text-5xl">Explore</h1>
          <p className="max-w-xl text-lg text-text-soft">Palettes published by the Open Air community.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-border p-0.5 text-sm">
            <Link href="/explore?sort=new" className={active === "new" ? "rounded-full bg-text px-3 py-1 text-canvas" : "rounded-full px-3 py-1 text-text-soft hover:text-text"}>New</Link>
            <Link href="/explore?sort=top" className={active === "top" ? "rounded-full bg-text px-3 py-1 text-canvas" : "rounded-full px-3 py-1 text-text-soft hover:text-text"}>Top</Link>
          </div>
          <Link href="/publish" className="rounded-full bg-text px-4 py-1.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90">Publish</Link>
        </div>
      </header>

      {feed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-text-soft">
          Nothing published yet. <Link href="/publish" className="underline underline-offset-4">Be the first to publish a palette.</Link>
        </div>
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
