import Link from "next/link";
import { Strata } from "@/components/palette/Strata";

export interface PublishedCardData {
  slug: string;
  name: string;
  hexes: string[];
  likeCount: number;
  authorName: string | null;
  authorHandle: string | null;
}

export function PublishedCard({ p }: { p: PublishedCardData }) {
  return (
    <Link href={`/s/${p.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-text">
      <Strata hexes={p.hexes} className="h-28 rounded-b-none" />
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate font-display text-text">{p.name}</p>
          <p className="truncate text-xs text-text-muted">
            {p.authorHandle ? `@${p.authorHandle}` : (p.authorName ?? "Anonymous")}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-text-muted">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.2C.3 8.3 2 5 5.2 5c2 0 3.3 1.1 3.8 2 .5-.9 1.8-2 3.8-2C16 5 17.7 8.3 16 11.8 14.5 16.4 12 21 12 21z" /></svg>
          {p.likeCount}
        </span>
      </div>
    </Link>
  );
}
