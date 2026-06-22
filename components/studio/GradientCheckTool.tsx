"use client";

import { useMemo, useState } from "react";
import { gradientStops, scanGradient, bestTextFor, type GradientSpace } from "@/lib/color/gradient";
import { clsx } from "@/lib/cn";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;
const norm = (h: string) => (HEX_RE.test(h) ? (h.startsWith("#") ? h : `#${h}`) : null);

export function GradientCheckTool() {
  const [from, setFrom] = useState("#4f46e5");
  const [to, setTo] = useState("#0ea5e9");
  const [text, setText] = useState<"auto" | "#ffffff" | "#0b0b0c">("auto");
  const [space, setSpace] = useState<GradientSpace>("oklch");

  const f = norm(from);
  const t = norm(to);

  const data = useMemo(() => {
    if (!f || !t) return null;
    const best = bestTextFor(f, t, space);
    const textColor = text === "auto" ? best.color : text;
    const scan = scanGradient(f, t, textColor, 28, space);
    const css = `linear-gradient(90deg, ${gradientStops(f, t, 12, space).join(", ")})`;
    return { scan, textColor, best, css };
  }, [f, t, text, space]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        {([["From", from, setFrom], ["To", to, setTo]] as const).map(([label, val, set]) => (
          <label key={label} className="flex flex-col gap-1 text-sm text-text-soft">
            {label}
            <div className="flex items-center gap-2">
              <input type="color" value={norm(val) ?? "#000000"} onChange={(e) => set(e.target.value)} aria-label={`${label} color`} className="h-10 w-12 cursor-pointer rounded-control border border-border bg-surface p-1" />
              <input value={val} onChange={(e) => set(e.target.value)} spellCheck={false} className="w-28 rounded-control border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none focus-visible:border-text" />
            </div>
          </label>
        ))}
        <div className="flex flex-col gap-1 text-sm text-text-soft">
          Text
          <div className="inline-flex rounded-pill border border-border p-0.5 text-xs">
            {(["auto", "#ffffff", "#0b0b0c"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setText(v)} className={clsx("rounded-pill px-2.5 py-1 transition-colors", v === text ? "bg-text text-canvas" : "text-text-soft hover:text-text")}>
                {v === "auto" ? "Auto" : v === "#ffffff" ? "White" : "Black"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 text-sm text-text-soft">
          Interpolation
          <div className="inline-flex rounded-pill border border-border p-0.5 text-xs">
            {(["oklch", "oklab", "srgb"] as GradientSpace[]).map((v) => (
              <button key={v} type="button" onClick={() => setSpace(v)} className={clsx("rounded-pill px-2.5 py-1 uppercase transition-colors", v === space ? "bg-text text-canvas" : "text-text-soft hover:text-text")}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {data ? (
        <>
          {/* Gradient with sampled text */}
          <div className="relative flex h-24 items-center overflow-hidden rounded-control border border-border" style={{ background: data.css }}>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((p) => {
              const stop = data.scan.stops.reduce((a, b) => (Math.abs(b.t - p) < Math.abs(a.t - p) ? b : a));
              return (
                <span key={p} className="flex-1 text-center text-sm font-medium" style={{ color: data.textColor, opacity: stop.pass ? 1 : 0.55 }} title={`${stop.ratio}:1`}>
                  Aa{stop.pass ? "" : " ⚠"}
                </span>
              );
            })}
          </div>

          {/* Safe-region bar */}
          <div className="flex h-3 overflow-hidden rounded-pill">
            {data.scan.stops.map((s, i) => (
              <span key={i} className="flex-1" style={{ backgroundColor: s.pass ? "var(--p-success, #16a34a)" : "var(--p-danger, #dc2626)" }} title={`${Math.round(s.t * 100)}%: ${s.ratio}:1`} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className={clsx("rounded-pill border px-2 py-0.5 text-xs font-medium", data.scan.passRatio === 1 ? "border-green-600/40 text-green-700 dark:text-green-400" : data.scan.passRatio === 0 ? "border-p-danger text-p-danger" : "border-amber-600/40 text-amber-700 dark:text-amber-400")}>
              {Math.round(data.scan.passRatio * 100)}% readable
            </span>
            <span className="text-text-soft">
              {data.scan.passRatio === 1
                ? "Text is readable across the whole gradient."
                : data.scan.passRatio === 0
                  ? "Text fails everywhere — switch text color or darken/lighten the gradient."
                  : `Readable in ${data.scan.safeRegions.map(([a, b]) => `${Math.round(a * 100)}–${Math.round(b * 100)}%`).join(", ")}. Avoid placing text elsewhere.`}
            </span>
            {text === "auto" ? (
              <span className="text-text-muted">Auto-picked {data.textColor === "#ffffff" ? "white" : "black"} text.</span>
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-sm text-p-danger">Enter two 6-digit hex colors.</p>
      )}
      <p className="text-xs text-text-muted">
        OKLCH/OKLab interpolation keeps mid-gradient colors vivid; sRGB can pass through muddy greys. The bar shows where overlaid text clears WCAG AA.
      </p>
    </div>
  );
}
