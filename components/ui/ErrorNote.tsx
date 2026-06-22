import { clsx } from "@/lib/cn";

export function ErrorNote({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return (
    <p className={clsx("rounded-control border border-p-danger/40 bg-p-danger/5 px-3 py-2 text-sm text-p-danger", className)} role="alert">
      {message}
    </p>
  );
}
