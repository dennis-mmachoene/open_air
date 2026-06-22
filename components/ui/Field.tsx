import { clsx } from "@/lib/cn";

const base =
  "w-full rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text placeholder:text-text-muted transition-colors ease-standard focus:border-text focus:outline-none";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(base, className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(base, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(base, "resize-y", className)} {...props} />;
}

/** A labelled field wrapper — gives inputs a real accessible name. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-text-soft">{label}</span>
      {children}
      {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
    </label>
  );
}
