"use client";

import { useState } from "react";
import type { Swatch } from "@/lib/palettes/types";

/** Full-bleed strata where each band copies its hex on click. */
export function CopyHex({ swatches }: { swatches: Swatch[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1400);
    } catch {
      /* no clipboard */
    }
  }

  return (
    <div className="flex h-64 overflow-hidden rounded-card border border-border sm:h-80">
      {swatches.map((s) => (
        <button
          key={`${s.hex}-${s.position}`}
          type="button"
          onClick={() => copy(s.hex)}
          className="group relative flex-1 cursor-pointer"
          style={{ backgroundColor: s.hex }}
          title={`Copy ${s.hex}`}
        >
          <span className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 p-3 opacity-0 transition-opacity ease-standard group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
            <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white">
              {copied === s.hex ? "Copied!" : s.hex}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
