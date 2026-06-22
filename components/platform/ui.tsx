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

export function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free: "border-border text-text-soft",
    pro: "border-text/30 text-text",
    studio: "border-text bg-text text-canvas",
  };
  return (
    <span className={clsx("rounded-full border px-2 py-0.5 text-xs font-medium capitalize", styles[plan] ?? styles.free)}>
      {plan}
    </span>
  );
}

export function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-text">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-lg border border-p-danger/40 bg-p-danger/5 px-3 py-2 text-sm text-p-danger">{message}</p>;
}
