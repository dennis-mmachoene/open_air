"use client";

import { useState } from "react";

export function CopyHex({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* ignore */ }
      }}
      className="inline-flex items-center gap-2 rounded-control border border-border px-2 py-1 font-mono text-xs text-text-soft hover:bg-surface-2"
    >
      <span className="h-3 w-3 rounded-sm border border-border" style={{ background: hex }} />
      {copied ? "Copied" : hex}
    </button>
  );
}
