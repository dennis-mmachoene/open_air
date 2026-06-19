import type { ReactNode } from "react";
import { clsx } from "@/lib/cn";

/** Frames one specimen on a palette surface. Reads only --p-* tokens. */
export function SpecimenCard({
  title,
  span = 1,
  children,
}: {
  title: string;
  span?: 1 | 2 | 3;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        span === 3 && "lg:col-span-3",
        span === 2 && "lg:col-span-2",
      )}
    >
      <div
        className="mb-2 text-[11px] font-medium uppercase tracking-wider"
        style={{ color: "var(--p-text-muted)" }}
      >
        {title}
      </div>
      <div
        className="rounded-xl border"
        style={{
          borderColor: "var(--p-border)",
          backgroundColor: "var(--p-surface)",
          padding: "var(--sp)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
