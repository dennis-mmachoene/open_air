"use client";

import { useMemo, useState } from "react";
import { generateSemanticTokens, type Mode, type SemanticToken } from "@/lib/color/tokens";
import {
  stressTest,
  CONDITION_LABELS,
  type CategoricalColor,
  type TextPair,
  type ConditionScore,
} from "@/lib/color/stress";
import { clsx } from "@/lib/cn";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

function scoreColor(score: number): string {
  if (score >= 90) return "text-green-700 dark:text-green-400";
  if (score >= 70) return "text-amber-700 dark:text-amber-400";
  return "text-p-danger";
}

export function StressTestTool({ initial = "#4f46e5" }: { initial?: string }) {
  const [hex, setHex] = useState(initial);
  const [mode, setMode] = useState<Mode>("light");

  const valid = HEX_RE.test(hex);
  const normalized = valid ? (hex.startsWith("#") ? hex : `#${hex}`) : null;

  const tokens = useMemo(() => {
    if (!normalized) return null;
    try {
      return generateSemanticTokens(normalized);
    } catch {
      return null;
    }
  }, [normalized]);

  const results = useMemo<ConditionScore[] | null>(() => {
    if (!tokens) return null;
    const t = new Map<string, SemanticToken>();
    tokens.groups.forEach((g) => g.tokens.forEach((x) => t.set(x.name, x)));
    const hexOf = (name: string) => t.get(name)?.[mode] ?? "#000000";
    const onOf = (name: string) => t.get(name)?.on?.[mode] ?? "#000000";

    const textPairs: TextPair[] = [
      { name: "Body text on background", fg: hexOf("foreground"), bg: hexOf("background") },
      { name: "Body text on surface", fg: hexOf("foreground"), bg: hexOf("surface") },
      { name: "Muted text on surface", fg: hexOf("foreground-muted"), bg: hexOf("surface") },
      { name: "Label on primary", fg: onOf("primary"), bg: hexOf("primary") },
      { name: "Label on accent", fg: onOf("accent"), bg: hexOf("accent") },
      { name: "Label on success", fg: onOf("success"), bg: hexOf("success") },
      { name: "Label on danger", fg: onOf("danger"), bg: hexOf("danger") },
    ];
    const categorical: CategoricalColor[] = [
      { name: "primary", hex: hexOf("primary") },
      { name: "accent", hex: hexOf("accent") },
      { name: "success", hex: hexOf("success") },
      { name: "warning", hex: hexOf("warning") },
      { name: "danger", hex: hexOf("danger") },
      { name: "info", hex: hexOf("info") },
    ];
    return stressTest(textPairs, categorical);
  }, [tokens, mode]);

  const overall = useMemo(() => {
    if (!results) return 0;
    // Worst-case score across conditions is the honest headline.
    return Math.min(...results.map((r) => r.score));
  }, [results]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm text-text-soft">
          Brand color
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normalized ?? "#4f46e5"}
              onChange={(e) => setHex(e.target.value)}
              aria-label="Pick brand color"
              className="h-10 w-12 cursor-pointer rounded-control border border-border bg-surface p-1"
            />
            <input
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              spellCheck={false}
              aria-label="Brand color hex"
              className={clsx(
                "w-32 rounded-control border bg-surface px-3 py-2 font-mono text-sm text-text outline-none",
                valid ? "border-border focus-visible:border-text" : "border-p-danger",
              )}
            />
          </div>
        </label>
        <div className="inline-flex rounded-pill border border-border p-0.5 text-sm">
          {(["light", "dark"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={clsx(
                "rounded-pill px-3 py-1 capitalize transition-colors ease-standard",
                m === mode ? "bg-text text-canvas" : "text-text-soft hover:text-text",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        {results ? (
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-text-soft">Worst-case score</span>
            <span className={clsx("font-display text-3xl", scoreColor(overall))}>{overall}</span>
          </div>
        ) : (
          <p className="text-sm text-p-danger">Enter a 6-digit hex color.</p>
        )}
      </div>

      {results ? (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((r) => (
            <section key={r.condition} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-text">{CONDITION_LABELS[r.condition]}</h3>
                <span className={clsx("font-display text-2xl", scoreColor(r.score))}>{r.score}</span>
              </div>

              {/* Transformed categorical swatches (how charts/badges would read) */}
              <div className="flex overflow-hidden rounded-control">
                {r.swatches.map((s) => (
                  <span key={s.name} className="h-8 flex-1" style={{ backgroundColor: s.hex }} title={s.name} />
                ))}
              </div>

              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <dt className="text-text-muted">Text pairs AA</dt>
                  <dd className={clsx(r.textPass === r.textTotal ? "text-text" : "text-p-danger")}>
                    {r.textPass}/{r.textTotal}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-text-muted">Colors distinct</dt>
                  <dd className={clsx(r.distinguishable === r.pairTotal ? "text-text" : "text-p-danger")}>
                    {r.distinguishable}/{r.pairTotal} pairs
                  </dd>
                </div>
              </dl>

              {/* Issues */}
              {(() => {
                const failText = r.textPairs.filter((t) => !t.pass).map((t) => t.name);
                const confused = r.confusions.filter((c) => !c.ok).map((c) => `${c.a}↔${c.b}`);
                if (failText.length === 0 && confused.length === 0) {
                  return <p className="text-xs text-text-muted">No issues under this condition.</p>;
                }
                return (
                  <div className="flex flex-col gap-1 text-xs text-text-soft">
                    {failText.length ? <p><span className="text-p-danger">Low contrast:</span> {failText.join(", ")}</p> : null}
                    {confused.length ? <p><span className="text-p-danger">Hard to tell apart:</span> {confused.join(", ")}</p> : null}
                  </div>
                );
              })()}
            </section>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-text-muted">
        Scores weight readable text (60%) and distinguishable colors (40%). Pairs that
        separate only by hue collapse under color-vision deficiencies — differentiate by
        lightness, shape, or labels too.
      </p>
    </div>
  );
}
