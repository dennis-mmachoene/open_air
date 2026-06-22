export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-control bg-surface-2" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="h-40 animate-pulse rounded-card bg-surface-2" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
