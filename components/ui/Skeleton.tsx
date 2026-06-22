import { clsx } from "@/lib/cn";

/** A single shimmer block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-control bg-surface-2", className)} />;
}

/** A page header placeholder (eyebrow + title + subtitle). */
export function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

/** A responsive grid of card placeholders (matches the palette/community grids). */
export function CardGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={clsx("grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3">
          <Skeleton className="h-24 rounded-control" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** A stack of row placeholders (lists: members, audit, settings). */
export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-card border border-border bg-surface p-4">
          <Skeleton className="h-9 w-16 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
