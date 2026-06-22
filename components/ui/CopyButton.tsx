"use client";

import { useState } from "react";
import { clsx } from "@/lib/cn";

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className,
  title,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={title ?? label}
      aria-label={title ?? label}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-pill text-sm transition-colors",
        className,
      )}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
