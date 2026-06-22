import { clsx } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "solid";

const TONE: Record<Tone, string> = {
  neutral: "border-border text-text-soft",
  success: "border-green-600/40 text-green-700 dark:text-green-400",
  warning: "border-amber-600/40 text-amber-700 dark:text-amber-400",
  danger: "border-p-danger/40 text-p-danger",
  solid: "border-text bg-text text-canvas",
};

export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={clsx("inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium capitalize", TONE[tone], className)}
      {...props}
    />
  );
}

/** Plan chip — single source of truth (was duplicated in AuthNav + platform/ui). */
export function PlanBadge({ plan }: { plan: string }) {
  const tone = plan === "studio" ? "solid" : "neutral";
  return <Badge tone={tone}>{plan}</Badge>;
}
