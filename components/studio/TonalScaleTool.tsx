"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import {
  generateTonalScale,
  scaleToCss,
  scaleToTailwind,
  scaleToJson,
  type ToneSwatch,
} from "@/lib/color/scale";
import { clsx } from "@/lib/cn";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;
type Format = "css" | "tailwind" | "json";

export function TonalScaleTool({ initial = "#4f46e5" }: { initial?: string }) {
  const [hex, setHex] = useState(initial);
  const [name, setName] = useState("brand");
  const [selected, setSelected] = useState<number>(500);
  const [format, setFormat] = useState<Format>("css");
  const [copied, setCopied] = useState(false);

  const valid = HEX_RE.test(hex);
  const normalized = valid ? (hex.startsWith("#") ? hex : `#${hex}`) : null;

  const scale = useMemo(() => {
    if (!normalized) return null;
    try {
      return generateTonalScale(normalized);
    } catch {
      return null;
    }
  }, [normalized]);

  const selectedSwatch: ToneSwatch | undefined = scale?.swatches.find((s) => s.stop === selected);

  const exportText = useMemo(() => {
    if (!scale) return "";
    if (format === "css") return scaleToCss(scale, name);
    if (format === "tailwind") return scaleToTailwind(scale, name);
    return scaleToJson(scale, name);
  }, [scale, format, name]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm text-text-soft">
          Base color
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normalized ?? "#4f46e5"}
              onChange={(e) => setHex(e.target.value)}
              aria-label="Pick base color"
              className="h-10 w-12 cursor-pointer rounded-control border border-border bg-surface p-1"
            />
            <input
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              spellCheck={false}
              aria-label="Base color hex"
              className={clsx(
                "w-32 rounded-control border bg-surface px-3 py-2 font-mono text-sm text-text outline-none",
                valid ? "border-border focus-visible:border-text" : "border-p-danger",
              )}
            />
          </div>
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-soft">
          Token name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            aria-label="Token name prefix"
            className="w-40 rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
          />
        </label>
        {scale ? (
          <p className="text-sm text-text-muted">
            Your color maps closest to{" "}
            <span className="font-medium text-text">{name || "brand"}-{scale.nearestStop}</span>.
          </p>
        ) : (
          <p className="text-sm text-p-danger">Enter a 6-digit hex color.</p>
        )}
      </div>

      {scale ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* The ramp */}
          <div className="overflow-hidden rounded-card border border-border">
            {scale.swatches.map((s) => {
              const isSel = s.stop === selected;
              const isNearest = s.stop === scale.nearestStop;
              return (
                <button
                  key={s.stop}
                  type="button"
                  onClick={() => setSelected(s.stop)}
                  aria-pressed={isSel}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-[outline] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text"
                  style={{ backgroundColor: s.hex, color: s.onColor }}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 font-mono text-sm font-medium">{s.stop}</span>
                    {isNearest ? (
                      <span
                        className="rounded-pill border px-1.5 text-[10px] uppercase tracking-wide"
                        style={{ borderColor: s.onColor }}
                      >
                        base
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-sm">{s.hex}</span>
                    <span className="hidden text-xs sm:inline">{s.onContrast}:1</span>
                    <span className="rounded-pill border px-1.5 py-0.5 text-[10px] font-medium" style={{ borderColor: s.onColor }}>
                      {s.aaa ? "AAA" : s.aa ? "AA" : "—"}
                    </span>
                    {isSel ? <span aria-hidden="true">●</span> : null}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail + export */}
          <div className="flex flex-col gap-6">
            {selectedSwatch ? (
              <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-text">{name || "brand"}-{selectedSwatch.stop}</h3>
                  <span
                    className="rounded-control px-2 py-0.5 font-mono text-xs"
                    style={{ backgroundColor: selectedSwatch.hex, color: selectedSwatch.onColor }}
                  >
                    Aa
                  </span>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-text-muted">HEX</dt>
                  <dd className="font-mono text-text">{selectedSwatch.hex}</dd>
                  <dt className="text-text-muted">RGB</dt>
                  <dd className="font-mono text-text">{selectedSwatch.rgb.r}, {selectedSwatch.rgb.g}, {selectedSwatch.rgb.b}</dd>
                  <dt className="text-text-muted">HSL</dt>
                  <dd className="font-mono text-text">{selectedSwatch.hsl.h}, {selectedSwatch.hsl.s}%, {selectedSwatch.hsl.l}%</dd>
                  <dt className="text-text-muted">OKLCH</dt>
                  <dd className="font-mono text-text">{selectedSwatch.oklch.l} {selectedSwatch.oklch.c} {selectedSwatch.oklch.h}</dd>
                  <dt className="text-text-muted">Luminance</dt>
                  <dd className="font-mono text-text">{selectedSwatch.luminance}</dd>
                  <dt className="text-text-muted">On color</dt>
                  <dd className="font-mono text-text">{selectedSwatch.onColor} · {selectedSwatch.onContrast}:1</dd>
                  <dt className="text-text-muted">Accessible</dt>
                  <dd className="text-text">
                    {selectedSwatch.aaa ? "AAA (normal text)" : selectedSwatch.aa ? "AA (normal text)" : "Large text only"}
                  </dd>
                </dl>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex rounded-pill border border-border p-0.5 text-xs">
                  {(["css", "tailwind", "json"] as Format[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={clsx(
                        "rounded-pill px-2.5 py-1 capitalize transition-colors ease-standard",
                        f === format ? "bg-text text-canvas" : "text-text-soft hover:text-text",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <Button size="sm"
                  type="button"
                  onClick={copy}
                  
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="max-h-72 overflow-auto rounded-control bg-canvas p-3 text-xs leading-relaxed text-text-soft">
                <code>{exportText}</code>
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
