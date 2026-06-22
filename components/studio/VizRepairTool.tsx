"use client";

import { useMemo, useState } from "react";
import { parseHexList } from "@/lib/color/repair";
import { repairCategorical, toCssVars, toJson } from "@/lib/color/dataviz";
import { transform, CONDITION_LABELS, type Condition } from "@/lib/color/stress";
import { clsx } from "@/lib/cn";

const SAMPLE = "#3a66cc, #3f69cf, #4a6fd2, #d62728, #d94a4a";
const CVD: Condition[] = ["deuteranopia", "protanopia", "tritanopia"];

function Swatches({ colors }: { colors: string[] }) {
  return (
    <div className="flex overflow-hidden rounded-control border border-border">
      {colors.map((c, i) => (
        <div key={i} className="h-12 flex-1" style={{ backgroundColor: c }} title={c} />
      ))}
    </div>
  );
}

function SafeBadge({ safe, minDistance }: { safe: boolean; minDistance: number }) {
  return (
    <span
      className={clsx(
        "rounded-pill border px-2 py-0.5 text-xs font-medium",
        safe ? "border-green-600/40 text-green-700 dark:text-green-400" : "border-amber-600/40 text-amber-700 dark:text-amber-400",
      )}
    >
      {safe ? "Colorblind-safe" : "Confusable"} · sep {minDistance}
    </span>
  );
}

export function VizRepairTool() {
  const [input, setInput] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  const colors = useMemo(() => parseHexList(input), [input]);
  const result = useMemo(() => (colors.length >= 2 ? repairCategorical(colors) : null), [colors]);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(toJson(result.output));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Paste your chart palette (hex colors)
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          spellCheck={false}
          className="rounded-control border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none focus-visible:border-text"
        />
      </label>

      {result ? (
        result.before.safe ? (
          <div className="flex flex-col gap-3">
            <SafeBadge safe minDistance={result.before.minDistance} />
            <p className="text-sm text-text-soft">
              This palette is already distinguishable under the common color-vision deficiencies — nothing to repair.
            </p>
            <Swatches colors={result.output} />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">Before</span>
                  <SafeBadge safe={result.before.safe} minDistance={result.before.minDistance} />
                </div>
                <Swatches colors={result.input} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">Repaired</span>
                  <SafeBadge safe={result.after.safe} minDistance={result.after.minDistance} />
                </div>
                <Swatches colors={result.output} />
              </div>
            </div>

            {/* CVD preview of the repaired set */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Repaired palette under color-vision deficiencies</span>
              {CVD.map((cond) => (
                <div key={cond} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-text-muted">{CONDITION_LABELS[cond]}</span>
                  <div className="flex flex-1 overflow-hidden rounded">
                    {result.output.map((c, i) => (
                      <div key={i} className="h-5 flex-1" style={{ backgroundColor: transform(c, cond) }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Changes */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">{result.changes.length} change{result.changes.length === 1 ? "" : "s"}</span>
              <ul className="flex flex-col gap-1.5">
                {result.changes.map((c) => (
                  <li key={c.index} className="flex items-center gap-2 text-sm">
                    <span className="text-text-muted">#{c.index + 1}</span>
                    <span className="h-5 w-5 rounded border border-border" style={{ backgroundColor: c.from }} />
                    <span className="font-mono text-xs text-text-muted">{c.from}</span>
                    <span className="text-text-muted">→</span>
                    <span className="h-5 w-5 rounded border border-border" style={{ backgroundColor: c.to }} />
                    <span className="font-mono text-xs text-text">{c.to}</span>
                  </li>
                ))}
              </ul>
            </div>

            <section className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text">Repaired palette</span>
                <button type="button" onClick={copy} className="rounded-pill bg-text px-3 py-1 text-xs font-medium text-canvas transition-opacity ease-standard hover:opacity-90">
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>
              <pre className="overflow-auto rounded-control bg-canvas p-3 text-sm text-text-soft"><code>{toCssVars(result.output, "series")}</code></pre>
            </section>
          </div>
        )
      ) : (
        <p className="text-sm text-text-muted">Paste at least two hex colors to analyze.</p>
      )}
    </div>
  );
}
