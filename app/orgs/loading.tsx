import { HeaderSkeleton, RowsSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12 sm:px-8">
      <HeaderSkeleton />
      <RowsSkeleton rows={3} />
    </div>
  );
}
