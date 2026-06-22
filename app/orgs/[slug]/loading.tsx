import { HeaderSkeleton, RowsSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-12 sm:px-8">
      <HeaderSkeleton />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <RowsSkeleton rows={3} />
      </div>
    </div>
  );
}
