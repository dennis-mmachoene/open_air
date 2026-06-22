import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { listBookmarks } from "@/lib/social";
import { PublishedCard } from "@/components/community/PublishedCard";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Saved palettes" };
export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const user = await requireUser();
  const saved = await listBookmarks(user.id);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Community</p>
        <h1 className="font-display text-4xl text-text">Saved palettes</h1>
        <p className="max-w-xl text-lg text-text-soft">Palettes you bookmarked from Explore.</p>
      </header>

      {saved.length === 0 ? (
        <EmptyState title="Nothing saved yet" description="Browse the community and tap Save to keep palettes here." action={<Link href="/explore" className="text-sm text-text underline-offset-4 hover:underline">Explore community palettes →</Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {saved.map((p) => (
            <PublishedCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
