"use client";

import { useState } from "react";
import { CopyButton } from "@/components/ui/CopyButton";
import { clsx } from "@/lib/cn";

interface Pal {
  slug: string;
  name: string;
  hexes: string[];
}
type GradType = "linear" | "radial" | "conic";

function buildCss(type: GradType, angle: number, hexes: string[]): string {
  const stops = hexes.join(", ");
  if (type === "radial") return `radial-gradient(in oklch circle at center, ${stops})`;
  if (type === "conic") return `conic-gradient(in oklch from ${angle}deg, ${stops})`;
  return `linear-gradient(in oklch ${angle}deg, ${stops})`;
}

function buildSvg(hexes: string[]): string {
  const stops = hexes
    .map((h, i) => `<stop offset="${Math.round((i / (hexes.length - 1)) * 100)}%" stop-color="${h}"/>`)
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs>` +
    `<rect width="600" height="240" fill="url(#g)"/></svg>`
  );
}

export function GradientTool({ palettes }: { palettes: Pal[] }) {
  const [slug, setSlug] = useState(palettes[0]?.slug ?? "");
  const [type, setType] = useState<GradType>("linear");
  const [angle, setAngle] = useState(90);

  const pal = palettes.find((p) => p.slug === slug) ?? palettes[0];
  const hexes = pal?.hexes ?? ["#000", "#fff"];
  const css = buildCss(type, angle, hexes);
  const cssRule = `background: ${css};`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text outline-none focus-visible:border-text"
        >
          {palettes.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
        <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
          {(["linear", "radial", "conic"] as GradType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={clsx(
                "rounded-full px-3 py-1 text-sm capitalize transition-colors",
                t === type ? "bg-text text-canvas" : "text-text-soft hover:text-text",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {type !== "radial" ? (
          <label className="flex items-center gap-2 text-sm text-text-soft">
            Angle
            <input
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
            <span className="w-10 font-mono text-xs">{angle}°</span>
          </label>
        ) : null}
      </div>

      <div className="h-64 w-full rounded-2xl border border-border" style={{ background: css }} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-text-muted">CSS</span>
          <div className="flex gap-2">
            <CopyButton value={cssRule} label="Copy CSS" copiedLabel="Copied" className="rounded-full border border-border px-3 py-1 text-text hover:bg-surface-2" />
            <CopyButton value={buildSvg(hexes)} label="Copy SVG" copiedLabel="Copied" className="rounded-full border border-border px-3 py-1 text-text hover:bg-surface-2" />
          </div>
        </div>
        <pre className="overflow-auto rounded-xl border border-border bg-surface-2 p-4 font-mono text-xs text-text">
          <code>{cssRule}</code>
        </pre>
        <p className="text-xs text-text-muted">
          Interpolated in OKLCH for smooth, non-muddy blends (modern browsers).
        </p>
      </div>
    </div>
  );
}
