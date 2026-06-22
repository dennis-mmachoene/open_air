"use client";

import { useMemo, useState } from "react";
import { gamutReport, printReport } from "@/lib/color/output";
import { clsx } from "@/lib/cn";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export function OutputCheckTool({ initial = "#16a34a" }: { initial?: string }) {
  const [hex, setHex] = useState(initial);
  const valid = HEX_RE.test(hex);
  const normalized = valid ? (hex.startsWith("#") ? hex : `#${hex}`) : null;

  const gamut = useMemo(() => {
    if (!normalized) return null;
    try {
      return gamutReport(normalized);
    } catch {
      return null;
    }
  }, [normalized]);

  const print = useMemo(() => {
    if (!normalized) return null;
    try {
      return printReport(normalized);
    } catch {
      return null;
    }
  }, [normalized]);

  return (
    <div className="flex flex-col gap-8">
      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Color
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={normalized ?? "#16a34a"}
            onChange={(e) => setHex(e.target.value)}
            aria-label="Pick a color"
            className="h-10 w-12 cursor-pointer rounded-control border border-border bg-surface p-1"
          />
          <input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            spellCheck={false}
            aria-label="Color hex"
            className={clsx(
              "w-32 rounded-control border bg-surface px-3 py-2 font-mono text-sm text-text outline-none",
              valid ? "border-border focus-visible:border-text" : "border-p-danger",
            )}
          />
        </div>
      </label>

      {gamut && print ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Wide gamut */}
          <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-text">Wide gamut</h2>
              <span
                className={clsx(
                  "rounded-pill border px-2 py-0.5 text-xs font-medium",
                  gamut.widerOnP3 ? "border-border text-text-soft" : "border-border text-text-muted",
                )}
              >
                {gamut.widerOnP3 ? "Richer on P3" : "Same on P3"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <div className="h-16 rounded-control" style={{ backgroundColor: gamut.srgbMaxHex }} />
                <p className="text-xs text-text-muted">sRGB max · chroma {gamut.srgbMaxChroma}</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-16 rounded-control" style={{ backgroundColor: gamut.p3MaxCss }} />
                <p className="text-xs text-text-muted">P3 max · chroma {gamut.p3MaxChroma}</p>
              </div>
            </div>

            <p className="text-sm text-text-soft">
              {gamut.widerOnP3
                ? `Display P3 reaches ${Math.round((gamut.headroom / Math.max(gamut.srgbMaxChroma, 0.001)) * 100)}% more chroma at this hue. The right swatch only looks more vivid on a wide-gamut (P3) display.`
                : "This color sits comfortably inside sRGB — it renders the same on standard and wide-gamut displays."}
            </p>
            <p className="font-mono text-xs text-text-muted">P3: {gamut.p3Css}</p>
          </section>

          {/* Print */}
          <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-text">Print (CMYK estimate)</h2>
              <span
                className={clsx(
                  "rounded-pill border px-2 py-0.5 text-xs font-medium",
                  print.printable ? "border-border text-text-soft" : "border-p-danger text-p-danger",
                )}
              >
                {print.printable ? "Prints well" : "Out of CMYK gamut"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <div className="h-16 rounded-control" style={{ backgroundColor: gamut.srgbHex }} />
                <p className="text-xs text-text-muted">On screen</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-16 rounded-control" style={{ backgroundColor: print.previewHex }} />
                <p className="text-xs text-text-muted">Estimated in print</p>
              </div>
            </div>

            <dl className="grid grid-cols-4 gap-2 text-center text-sm">
              {(["c", "m", "y", "k"] as const).map((ch) => (
                <div key={ch} className="rounded-control border border-border py-2">
                  <dt className="text-xs uppercase text-text-muted">{ch}</dt>
                  <dd className="font-mono text-text">{print.cmyk[ch]}%</dd>
                </div>
              ))}
            </dl>

            <p className="text-sm text-text-soft">
              Ink coverage{" "}
              <span className={clsx("font-medium", print.heavyInk ? "text-p-danger" : "text-text")}>
                {print.inkCoverage}%
              </span>
              {print.heavyInk ? " — over the ~300% sheet-fed limit; may need reduction." : "."}
              {!print.printable
                ? " This color is too vivid for CMYK and will print duller than on screen."
                : ""}
            </p>
          </section>
        </div>
      ) : (
        <p className="text-sm text-p-danger">Enter a 6-digit hex color.</p>
      )}

      <p className="text-xs text-text-muted">
        P3 values use CSS <code className="rounded bg-surface-2 px-1 py-0.5">color(display-p3 …)</code>;
        CMYK and print preview are device-independent estimates — proof on your press for exact results.
      </p>
    </div>
  );
}
