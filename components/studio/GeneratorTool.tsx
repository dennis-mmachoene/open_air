"use client";

import { useEffect, useRef, useState } from "react";
import type { Palette } from "@/lib/palettes/types";
import { HARMONY_OPTIONS } from "@/lib/user-palettes";
import { Strata } from "@/components/palette/Strata";
import { ExportPanel } from "@/components/palette/ExportPanel";

const ROLE_KEYS: [string, keyof Palette["roles"]["light"]][] = [
  ["Primary", "primary"],
  ["Secondary", "secondary"],
  ["Accent", "accent"],
  ["Success", "success"],
  ["Warning", "warning"],
  ["Danger", "danger"],
];

export function GeneratorTool() {
  const [name, setName] = useState("My palette");
  const [baseHue, setBaseHue] = useState(220);
  const [harmony, setHarmony] = useState<(typeof HARMONY_OPTIONS)[number]>("Analogous");
  const [chroma, setChroma] = useState(0.12);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function generate(spec: { name: string; baseHue: number; harmony: string; chroma: number }) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spec),
    });
    const data: { palette?: Palette } = await res.json();
    if (data.palette) {
      setPalette(data.palette);
      setSaved(false);
    }
  }

  // initial + debounced regeneration
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void generate({ name, baseHue, harmony, chroma });
    }, 200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [name, baseHue, harmony, chroma]);

  async function save() {
    const res = await fetch("/api/generate/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, baseHue, harmony, chroma }),
    });
    if (res.ok) setSaved(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      {/* Controls */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border p-5">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-text-muted">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="flex items-center justify-between text-xs uppercase tracking-wide text-text-muted">
            <span>Base hue</span>
            <span className="font-mono">{baseHue}°</span>
          </span>
          <input
            type="range"
            min={0}
            max={360}
            value={baseHue}
            onChange={(e) => setBaseHue(Number(e.target.value))}
            style={{
              accentColor: `oklch(0.6 0.18 ${baseHue})`,
            }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-text-muted">Harmony</span>
          <select
            value={harmony}
            onChange={(e) => setHarmony(e.target.value as (typeof HARMONY_OPTIONS)[number])}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
          >
            {HARMONY_OPTIONS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="flex items-center justify-between text-xs uppercase tracking-wide text-text-muted">
            <span>Chroma</span>
            <span className="font-mono">{chroma.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.04}
            max={0.16}
            step={0.01}
            value={chroma}
            onChange={(e) => setChroma(Number(e.target.value))}
          />
        </label>

        <button
          type="button"
          onClick={save}
          className="rounded-full bg-text px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
        >
          {saved ? "Saved ✓" : "Save palette"}
        </button>
      </div>

      {/* Preview */}
      <div className="flex flex-col gap-6">
        {palette ? (
          <>
            <Strata hexes={palette.swatches.map((s) => s.hex)} className="h-40" />
            <div className="flex flex-wrap gap-3">
              {ROLE_KEYS.map(([label, key]) => (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-md border border-border"
                    style={{ backgroundColor: palette.roles.light[key] }}
                  />
                  <span className="text-xs text-text-soft">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-text-soft">{palette.why.rationale}</p>
            <div className="rounded-2xl border border-border p-5">
              <h3 className="mb-3 font-display text-lg text-text">Export</h3>
              <ExportPanel
                roles={palette.roles.light}
                swatches={palette.swatches}
                name={palette.name}
                slug={palette.slug}
                pro
              />
            </div>
          </>
        ) : (
          <p className="text-text-muted">Generating…</p>
        )}
      </div>
    </div>
  );
}
