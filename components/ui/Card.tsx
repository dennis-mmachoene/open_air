import { clsx } from "@/lib/cn";

/** A surface card with the standard card radius + padding. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-card border border-border bg-surface p-5", className)} {...props} />;
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-text">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
