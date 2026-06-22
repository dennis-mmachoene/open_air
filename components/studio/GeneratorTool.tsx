"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { generatePalette } from "@/lib/palettes/generate";
import type { Palette } from "@/lib/palettes/types";
import { HARMONY_OPTIONS } from "@/lib/user-palettes";
import { Strata } from "@/components/palette/Strata";
import { ExportPanel } from "@/components/palette/ExportPanel";

const EMPTY_CATS = { mood: [], family: [], industry: [], style: [], season: [] };

const ROLE_KEYS: [string, keyof Palette["roles"]["light"]][] = [
  ["Primary", "primary"],
  ["Secondary", "secondary"],
  ["Accent", "accent"],
  ["Success", "success"],
  ["Warning", "warning"],
  ["Danger", "danger"],
];

export function GeneratorTool() {
  const { data: session, status } = useSession();
  const isPro = session?.user?.plan === "pro" || session?.user?.plan === "studio";

  const [name, setName] = useState("My palette");
  const [baseHue, setBaseHue] = useState(220);
  const [harmony, setHarmony] = useState<(typeof HARMONY_OPTIONS)[number]>("Analogous");
  const [chroma, setChroma] = useState(0.12);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Generation is pure, isomorphic math — run it instantly in the browser.
  const palette = useMemo<Palette | null>(() => {
    try {
      return generatePalette(
        { name: name.trim() || "My palette", story: "A generated palette.", baseHue, harmony, chroma },
        EMPTY_CATS,
      );
    } catch {
      return null;
    }
  }, [name, baseHue, harmony, chroma]);

  async function save() {
    setSaveMsg(null);
    if (status !== "authenticated") {
      setSaveMsg("Sign in to save this palette.");
      return;
    }
    const res = await fetch("/api/generate/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, baseHue, harmony, chroma }),
    });
    if (res.ok) setSaveMsg("Saved to your palettes ✓");
    else if (res.status === 403) setSaveMsg("Saving generated palettes is a Pro feature.");
    else setSaveMsg("Couldn't save.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      {/* Controls */}
      <div className="flex flex-col gap-5 rounded-card border border-border p-5">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-text-muted">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
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
            style={{ accentColor: `oklch(0.6 0.18 ${baseHue})` }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-text-muted">Harmony</span>
          <select
            value={harmony}
            onChange={(e) => setHarmony(e.target.value as (typeof HARMONY_OPTIONS)[number])}
            className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
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
          className="rounded-pill bg-text px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
        >
          Save palette
        </button>
        {saveMsg ? <span className="text-sm text-text-soft">{saveMsg}</span> : null}
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
                    className="h-6 w-6 rounded-control border border-border"
                    style={{ backgroundColor: palette.roles.light[key] }}
                  />
                  <span className="text-xs text-text-soft">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-text-soft">{palette.why.rationale}</p>
            <div className="rounded-card border border-border p-5">
              <h3 className="mb-3 font-display text-lg text-text">Export</h3>
              <ExportPanel
                roles={palette.roles.light}
                swatches={palette.swatches}
                name={palette.name}
                slug={palette.slug}
                pro={isPro}
              />
            </div>
          </>
        ) : (
          <p className="text-text-muted">Adjust the controls to generate a palette.</p>
        )}
      </div>
    </div>
  );
}
