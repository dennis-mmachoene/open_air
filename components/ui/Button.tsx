import { clsx } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "bg-text text-canvas hover:opacity-90",
  secondary: "border border-border text-text hover:bg-surface-2",
  ghost: "text-text-soft hover:bg-surface-2 hover:text-text",
  danger: "border border-p-danger/40 text-p-danger hover:bg-p-danger/5",
};
const SIZE: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** The single app-wide button. Pill radius, one easing, consistent sizing. */
export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-[color,background-color,opacity] ease-standard disabled:opacity-50 disabled:pointer-events-none",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  );
}
