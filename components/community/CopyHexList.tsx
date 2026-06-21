"use client";

import { useState } from "react";

export function CopyHexList({ hexes }: { hexes: string[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* noop */
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {hexes.map((hex, i) => (
        <button
          key={`${hex}-${i}`}
          type="button"
          onClick={() => copy(hex)}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-text transition-colors hover:bg-surface-2"
        >
          <span className="h-4 w-4 rounded" style={{ backgroundColor: hex }} />
          {copied === hex ? "Copied" : hex}
        </button>
      ))}
    </div>
  );
}
