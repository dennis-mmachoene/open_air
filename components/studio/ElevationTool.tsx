"use client";

import { useMemo, useState } from "react";
import { elevation, elevationToCss } from "@/lib/color/elevation";
import { clsx } from "@/lib/cn";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export function ElevationTool({ initial = "#4f46e5" }: { initial?: string }) {
  const [hex, setHex] = useState(initial);
  const [copied, setCopied] = useState(false);
  const valid = HEX_RE.test(hex);
  const normalized = valid ? (hex.startsWith("#") ? hex : `#${hex}`) : null;

  const levels = useMemo(() => (normalized ? elevation(normalized, 5) : null), [normalized]);

  async function copy() {
    if (!levels) return;
    try {
      await navigator.clipboard.writeText(elevationToCss(levels));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Brand color (tints the shadow)
        <div className="flex items-center gap-2">
          <input type="color" value={normalized ?? "#4f46e5"} onChange={(e) => setHex(e.target.value)} aria-label="Brand color" className="h-10 w-12 cursor-pointer rounded-control border border-border bg-surface p-1" />
          <input value={hex} onChange={(e) => setHex(e.target.value)} spellCheck={false} className={clsx("w-32 rounded-control border bg-surface px-3 py-2 font-mono text-sm text-text outline-none", valid ? "border-border focus-visible:border-text" : "border-p-danger")} />
        </div>
      </label>

      {levels ? (
        <>
          <div className="grid grid-cols-2 gap-6 rounded-card border border-border bg-surface-2 p-8 sm:grid-cols-3 lg:grid-cols-5">
            {levels.map((l) => (
              <div key={l.level} className="flex flex-col items-center gap-3">
                <div className="flex h-20 w-full items-center justify-center rounded-control bg-canvas text-sm font-medium text-text" style={{ boxShadow: l.boxShadow }}>
                  {l.level}
                </div>
                <span className="text-xs text-text-muted">elevation-{l.level}</span>
              </div>
            ))}
          </div>

          <section className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">CSS</span>
              <button type="button" onClick={copy} className="rounded-pill bg-text px-3 py-1 text-xs font-medium text-canvas transition-opacity hover:opacity-90">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="max-h-64 overflow-auto rounded-control bg-canvas p-3 text-xs leading-relaxed text-text-soft">
              <code>{elevationToCss(levels)}</code>
            </pre>
          </section>
        </>
      ) : (
        <p className="text-sm text-p-danger">Enter a 6-digit hex color.</p>
      )}
    </div>
  );
}
