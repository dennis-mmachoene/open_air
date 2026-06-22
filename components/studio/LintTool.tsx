"use client";

import { useMemo, useState } from "react";
import { parseHexList } from "@/lib/color/repair";
import { lintHexes, type Severity } from "@/lib/color/lint";
import { clsx } from "@/lib/cn";

const SAMPLE = "#1d4ed8\n#1e4fd9\n#f59e0b\n#0b1220\n#808080\n#f8fafc";

const SEV_STYLE: Record<Severity, string> = {
  error: "border-p-danger/40 bg-p-danger/5 text-p-danger",
  warning: "border-amber-600/40 bg-amber-600/5 text-amber-700 dark:text-amber-400",
  info: "border-border bg-surface text-text-soft",
};
const SEV_DOT: Record<Severity, string> = {
  error: "bg-p-danger",
  warning: "bg-amber-600",
  info: "bg-text-muted",
};

export function LintTool() {
  const [text, setText] = useState(SAMPLE);
  const hexes = useMemo(() => parseHexList(text), [text]);
  const report = useMemo(() => lintHexes(hexes), [hexes]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-text" htmlFor="lint-input">Colors</label>
          <textarea
            id="lint-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 font-mono text-sm text-text focus:border-text focus:outline-none"
            placeholder="#1d4ed8, #f59e0b, …"
          />
          <div className="flex flex-wrap gap-1.5">
            {hexes.map((h, i) => (
              <span key={`${h}-${i}`} className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 font-mono text-xs text-text-soft">
                <span className="h-3 w-3 rounded-sm border border-border" style={{ background: h }} />
                {h}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-col">
              <span className="text-sm text-text-soft">Lint score</span>
              <span className="font-display text-4xl text-text">{report.score}</span>
            </div>
            <div className="flex flex-1 flex-wrap gap-2 text-xs">
              <Badge label="errors" n={report.counts.error} tone="error" />
              <Badge label="warnings" n={report.counts.warning} tone="warning" />
              <Badge label="info" n={report.counts.info} tone="info" />
              <span className={clsx("ml-auto self-center rounded-full px-3 py-1 font-medium", report.passed ? "bg-green-600/15 text-green-700 dark:text-green-400" : "bg-p-danger/10 text-p-danger")}>
                {report.passed ? "Passing" : "Has errors"}
              </span>
            </div>
          </div>

          {report.violations.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-text-soft">No issues found. This set is clean. ✨</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {report.violations.map((v, i) => (
                <li key={i} className={clsx("flex items-start gap-3 rounded-xl border px-3 py-2 text-sm", SEV_STYLE[v.severity])}>
                  <span className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEV_DOT[v.severity])} />
                  <div className="flex flex-col">
                    <span>{v.message}</span>
                    <span className="font-mono text-[11px] opacity-70">{v.rule}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ label, n, tone }: { label: string; n: number; tone: Severity }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1", SEV_STYLE[tone])}>
      <span className={clsx("h-2 w-2 rounded-full", SEV_DOT[tone])} />
      {n} {label}
    </span>
  );
}
