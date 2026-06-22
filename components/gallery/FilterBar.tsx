"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx } from "@/lib/cn";

export interface Facet {
  kind: string;
  label: string;
  values: string[];
}

export function FilterBar({ facets }: { facets: Facet[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const apply = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const toggle = (kind: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (next.get(kind) === value) next.delete(kind);
    else next.set(kind, value);
    apply(next);
  };

  const onSearch = (value: string) => {
    setQ(value);
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    apply(next);
  };

  const hasFilters = [...params.keys()].length > 0;

  return (
    <div className="sticky top-16 z-30 border-y border-border bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search palettes…"
            className="w-full max-w-xs rounded-pill border border-border bg-surface px-4 py-1.5 text-sm text-text outline-none placeholder:text-text-muted focus-visible:border-text"
          />
          {hasFilters ? (
            <button
              type="button"
              onClick={() => router.push(pathname, { scroll: false })}
              className="shrink-0 text-sm text-text-soft underline-offset-4 hover:text-text hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
          {facets.map((facet) => (
            <div key={facet.kind} className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs uppercase tracking-wide text-text-muted">
                {facet.label}
              </span>
              {facet.values.map((value) => {
                const active = params.get(facet.kind) === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggle(facet.kind, value)}
                    className={clsx(
                      "shrink-0 rounded-pill border px-3 py-1 text-sm transition-colors",
                      active
                        ? "border-text bg-text text-canvas"
                        : "border-border text-text-soft hover:border-text hover:text-text",
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
