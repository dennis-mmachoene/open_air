import { clsx } from "@/lib/cn";

export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-5">
      <span className="text-sm text-text-soft">{label}</span>
      <span className="font-display text-3xl text-text">{value}</span>
      {sub ? <span className="text-xs text-text-muted">{sub}</span> : null}
    </div>
  );
}

const PLAN_STYLES: Record<string, string> = {
  free: "border-border text-text-soft",
  pro: "border-text/30 text-text",
  studio: "border-text bg-text text-canvas",
};

export function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={clsx("rounded-full border px-2 py-0.5 text-xs font-medium capitalize", PLAN_STYLES[plan] ?? PLAN_STYLES.free)}>
      {plan}
    </span>
  );
}

export function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-text" style={{ width: `${pct}%` }} />
    </div>
  );
}
