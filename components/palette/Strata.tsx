import { clsx } from "@/lib/cn";

/** Signature motif: stacked horizontal colour bands. */
export function Strata({
  hexes,
  className,
  rounded = true,
  vertical = false,
}: {
  hexes: string[];
  className?: string;
  rounded?: boolean;
  vertical?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex overflow-hidden",
        vertical ? "flex-col" : "flex-row",
        rounded && "rounded-control",
        className,
      )}
      aria-hidden="true"
    >
      {hexes.map((hex, i) => (
        <div
          key={`${hex}-${i}`}
          className="flex-1"
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}
