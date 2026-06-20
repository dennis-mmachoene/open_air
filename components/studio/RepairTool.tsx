"use client";

import { useMemo, useState } from "react";
import { grade } from "@/lib/color/contrast";
import { hexToOklch } from "@/lib/color/convert";
import { parseHexList, repairForContrast } from "@/lib/color/repair";
import { CopyButton } from "@/components/ui/CopyButton";
import { clsx } from "@/lib/cn";

const SAMPLE = "#0a7cff\n#9be7ff\n#ffd166\n#10b981\n#1c1c1a\n#f4f4f5";

function lightest(colors: string[]): string | null {
  let best: string | null = null;
  let bestL = -1;
  for (const c of colors) {
    const l = hexToOklch(c).l;
    if (l > bestL) {
      bestL = l;
      best = c;
    }
  }
  return best;
}

export function RepairTool() {
  const [input, setInput] = useState(SAMPLE);
  const [bgChoice, setBgChoice] = useState<string | null>(null);

  const colors = useMemo(() => parseHexList(input), [input]);
  const bgOptions = useMemo(
    () => [...new Set([...colors, "#ffffff", "#0b0b0c"])],
    [colors],
  );
  const bg = bgChoice && bgOptions.includes(bgChoice) ? bgChoice : lightest(colors) ?? "#ffffff";

  const rows = useMemo(
    () => colors.filter((c) => c !== bg).map((fg) => ({ fg, ...repairForContrast(fg, bg) })),
    [colors, bg],
  );

  const failing = rows.filter((r) => r.ratio < 4.5).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Input */}
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">
              Paste your palette (hex)
            </span>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={7}
              className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none focus-visible:border-text"
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-text-muted">Background</span>
            <div className="flex flex-wrap gap-1.5">
              {bgOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBgChoice(c)}
                  title={c}
                  aria-label={`Use ${c} as background`}
                  className={clsx(
                    "h-7 w-7 rounded-md border",
                    c === bg ? "ring-2 ring-text" : "border-border",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Report */}
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-soft">
            {colors.length === 0
              ? "Enter some hex colours to check."
              : failing === 0
                ? "Every colour clears WCAG AA on this background."
                : `${failing} of ${rows.length} colours fail AA on this background — repaired variants below preserve each hue.`}
          </p>
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="px-3 py-2 font-medium">Colour</th>
                  <th className="px-3 py-2 font-medium">On bg</th>
                  <th className="px-3 py-2 font-medium">Ratio</th>
                  <th className="px-3 py-2 font-medium">Fix</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.fg} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2 font-mono text-xs text-text">
                        <span className="h-4 w-4 rounded border border-border" style={{ backgroundColor: r.fg }} />
                        {r.fg}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded px-2 py-1 font-mono text-xs" style={{ backgroundColor: bg, color: r.fg }}>
                        Aa
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-text-soft">
                      {r.ratio.toFixed(2)}{" "}
                      <span className={clsx(grade(r.ratio) === "Fail" ? "text-p-danger" : "text-p-success")}>
                        {grade(r.ratio) === "Fail" ? "✕" : "✓"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {r.changed ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="rounded px-2 py-1 font-mono text-xs" style={{ backgroundColor: bg, color: r.repaired }}>
                            Aa
                          </span>
                          <span className="font-mono text-xs text-text">{r.repaired}</span>
                          <span className="font-mono text-xs text-text-muted">({r.newRatio.toFixed(2)})</span>
                          <CopyButton value={r.repaired} label="Copy" copiedLabel="✓" className="text-text-muted hover:text-text" />
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
