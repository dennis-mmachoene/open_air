import { clsx } from "@/lib/cn";

/** The Open Air mark: a framed stack of colour strata — the signature motif,
 *  monochrome so it sits quietly in the chrome (uses currentColor). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="3.5" width="19" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="5.5" y="7.4" width="13" height="2.2" rx="1.1" fill="currentColor" />
      <rect x="5.5" y="10.9" width="13" height="2.2" rx="1.1" fill="currentColor" opacity="0.6" />
      <rect x="5.5" y="14.4" width="13" height="2.2" rx="1.1" fill="currentColor" opacity="0.32" />
    </svg>
  );
}

/** Mark + wordmark, for the header and footer. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <LogoMark className={clsx("h-6 w-6 text-text", markClassName)} />
      <span className="font-display text-xl font-medium tracking-tight text-text">Open Air</span>
    </span>
  );
}
