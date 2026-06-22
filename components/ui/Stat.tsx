export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-surface p-5">
      <span className="text-sm text-text-soft">{label}</span>
      <span className="font-display text-3xl text-text">{value}</span>
      {sub ? <span className="text-xs text-text-muted">{sub}</span> : null}
    </div>
  );
}
