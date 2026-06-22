"use client";

import { useState } from "react";
import { clsx } from "@/lib/cn";
import { useToast } from "./Toast";

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
  const { success } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      success(copiedLabel);
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
        "inline-flex items-center gap-1.5 rounded-pill text-sm transition-colors ease-standard",
        className,
      )}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
