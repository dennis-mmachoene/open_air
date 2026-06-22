"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import {
  categorical,
  categoricalReport,
  sequential,
  diverging,
  toCssVars,
  toJsArray,
  toJson,
} from "@/lib/color/dataviz";
import { transform, CONDITION_LABELS, type Condition } from "@/lib/color/stress";
import { clsx } from "@/lib/cn";

type Kind = "categorical" | "sequential" | "diverging";
type Format = "css" | "js" | "json";
const CVD_PREVIEW: Condition[] = ["deuteranopia", "protanopia", "tritanopia"];

export function DataVizTool() {
  const [kind, setKind] = useState<Kind>("categorical");
  const [count, setCount] = useState(8);
  const [hue, setHue] = useState(255);
  const [hueLow, setHueLow] = useState(27);
  const [hueHigh, setHueHigh] = useState(255);
  const [format, setFormat] = useState<Format>("css");
  const [copied, setCopied] = useState(false);

  const colors = useMemo(() => {
    if (kind === "categorical") return categorical(count);
    if (kind === "sequential") return sequential(count, hue);
    return diverging(count, hueLow, hueHigh);
  }, [kind, count, hue, hueLow, hueHigh]);

  const report = useMemo(
    () => (kind === "categorical" ? categoricalReport(colors) : null),
    [kind, colors],
  );

  const exportText = useMemo(() => {
    const name = kind === "categorical" ? "series" : kind;
    if (format === "css") return toCssVars(colors, name);
    if (format === "js") return toJsArray(colors, name);
    return toJson(colors);
  }, [colors, format, kind]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Type + controls */}
      <div className="flex flex-col gap-4">
        <div className="inline-flex w-fit rounded-pill border border-border p-0.5 text-sm">
          {(["categorical", "sequential", "diverging"] as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={clsx(
                "rounded-pill px-3 py-1 capitalize transition-colors ease-standard",
                k === kind ? "bg-text text-canvas" : "text-text-soft hover:text-text",
              )}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-5">
          {kind === "categorical" ? (
            <div className="flex flex-col gap-1 text-sm text-text-soft">
              Categories
              <div className="inline-flex rounded-pill border border-border p-0.5">
                {[5, 8, 12, 20].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={clsx(
                      "rounded-pill px-3 py-1 text-sm transition-colors ease-standard",
                      n === count ? "bg-text text-canvas" : "text-text-soft hover:text-text",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <label className="flex flex-col gap-1 text-sm text-text-soft">
              Steps: {count}
              <input
                type="range"
                min={3}
                max={11}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-40"
              />
            </label>
          )}

          {kind === "sequential" ? (
            <label className="flex flex-col gap-1 text-sm text-text-soft">
              Hue: {hue}°
              <input type="range" min={0} max={359} value={hue} onChange={(e) => setHue(Number(e.target.value))} className="w-48" />
            </label>
          ) : null}
          {kind === "diverging" ? (
            <>
              <label className="flex flex-col gap-1 text-sm text-text-soft">
                Low hue: {hueLow}°
                <input type="range" min={0} max={359} value={hueLow} onChange={(e) => setHueLow(Number(e.target.value))} className="w-40" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-text-soft">
                High hue: {hueHigh}°
                <input type="range" min={0} max={359} value={hueHigh} onChange={(e) => setHueHigh(Number(e.target.value))} className="w-40" />
              </label>
            </>
          ) : null}
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-col gap-3">
        <div className="flex overflow-hidden rounded-control border border-border">
          {colors.map((c, i) => (
            <div key={i} className="h-16 flex-1" style={{ backgroundColor: c }} title={c} />
          ))}
        </div>

        {/* CVD safety + simulated rows (categorical only) */}
        {report ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span
                className={clsx(
                  "rounded-pill border px-2 py-0.5 text-xs font-medium",
                  report.safe ? "border-green-600/40 text-green-700 dark:text-green-400" : "border-amber-600/40 text-amber-700 dark:text-amber-400",
                )}
              >
                {report.safe ? "Colorblind-safe" : `${report.confusions.length} confusable pair${report.confusions.length === 1 ? "" : "s"}`}
              </span>
              <span className="text-text-muted">
                {report.safe
                  ? "Distinguishable under deuteranopia, protanopia & tritanopia."
                  : "Some categories collapse under a color-vision deficiency — differentiate by shape/label too."}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {CVD_PREVIEW.map((cond) => (
                <div key={cond} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-text-muted">{CONDITION_LABELS[cond]}</span>
                  <div className="flex flex-1 overflow-hidden rounded">
                    {colors.map((c, i) => (
                      <div key={i} className="h-5 flex-1" style={{ backgroundColor: transform(c, cond) }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* hex chips */}
        <div className="flex flex-wrap gap-1.5">
          {colors.map((c, i) => (
            <span key={i} className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-text-soft">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Export */}
      <section className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-pill border border-border p-0.5 text-xs">
            {(["css", "js", "json"] as Format[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={clsx(
                  "rounded-pill px-2.5 py-1 uppercase transition-colors ease-standard",
                  f === format ? "bg-text text-canvas" : "text-text-soft hover:text-text",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Button size="sm" type="button" onClick={copy} >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <pre className="max-h-64 overflow-auto rounded-control bg-canvas p-3 text-xs leading-relaxed text-text-soft">
          <code>{exportText}</code>
        </pre>
      </section>
    </div>
  );
}
