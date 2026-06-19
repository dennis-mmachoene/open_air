import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <h3 className="font-display text-xl text-text">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-text-soft">{description}</p> : null}
      {action}
    </div>
  );
}
