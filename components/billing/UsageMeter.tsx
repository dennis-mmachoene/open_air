import Link from "next/link";

/**
 * Saves usage for the dashboard. Free users see "X / 5 saves" with a bar and a
 * nudge as they approach the cap; paid users see an unlimited badge.
 */
export function UsageMeter({
  used,
  limit,
  plan,
}: {
  used: number;
  limit: number | null;
  plan: string;
}) {
  if (limit === null) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4">
        <span className="text-sm text-text">Saved palettes</span>
        <span className="text-sm text-text-soft">
          Unlimited · <span className="capitalize text-text">{plan}</span>
        </span>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((used / limit) * 100));
  const atLimit = used >= limit;
  const near = !atLimit && used >= limit - 1;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text">Saved palettes</span>
        <span className="text-sm tabular-nums text-text-soft">
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? "bg-amber-500" : "bg-text"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {(atLimit || near) && (
        <p className="text-xs text-text-soft">
          {atLimit ? "You've hit the free limit." : "One save left on the free plan."}{" "}
          <Link href="/pricing" className="font-medium text-text underline underline-offset-4">
            Go Pro
          </Link>{" "}
          for unlimited saves.
        </p>
      )}
    </div>
  );
}
