"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Palette } from "@/lib/palettes/types";
import type { QueryResult } from "@/lib/palettes/query";
import { PaletteCard } from "./PaletteCard";

export function InfiniteGrid({
  initial,
  query,
  total,
}: {
  initial: Palette[];
  /** Serialized querystring for the active filter (without cursor). */
  query: string;
  total: number;
}) {
  const [items, setItems] = useState<Palette[]>(initial);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // Live values in refs so the observer can subscribe ONCE and never re-fire in
  // a loop. The cursor starts at the last server-rendered item, so the first
  // fetch continues from page 2 (no wasteful re-fetch of page 1).
  const loadingRef = useRef(false);
  const cursorRef = useRef<string | null>(initial.at(-1)?.slug ?? null);
  const doneRef = useRef(initial.length >= total);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || doneRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const sp = new URLSearchParams(query);
      if (cursorRef.current) sp.set("cursor", cursorRef.current);
      const res = await fetch(`/api/palettes?${sp.toString()}`);
      const data: QueryResult = await res.json();

      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.slug));
        const fresh = data.items.filter((p) => !seen.has(p.slug));
        return fresh.length ? [...prev, ...fresh] : prev;
      });

      // Advance the cursor; stop when the API reports no more (or returns nothing).
      doneRef.current = !data.nextCursor || data.items.length === 0;
      cursorRef.current = data.nextCursor;
    } catch {
      doneRef.current = true; // fail safe: never loop on a bad response
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const done = items.length >= total;

  return (
    <div className="flex flex-col gap-6">
      {items.length === 0 ? (
        <p className="px-5 py-16 text-center text-text-soft sm:px-8">
          No palettes match those filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <PaletteCard key={p.slug} palette={p} />
          ))}
        </div>
      )}

      {!done ? (
        <div ref={sentinel} className="flex h-8 items-center justify-center">
          <span
            className="text-sm text-text-muted transition-opacity ease-standard duration-200"
            style={{ opacity: loading ? 1 : 0 }}
            aria-live="polite"
          >
            Loading more…
          </span>
        </div>
      ) : null}
    </div>
  );
}
