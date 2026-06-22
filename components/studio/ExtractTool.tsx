"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { hexToOklch, toHex, type OKLCH } from "@/lib/color/convert";
import { circularMean, classifyHarmony, type Harmony } from "@/lib/color/harmony";
import { generatePalette } from "@/lib/palettes/generate";
import type { Palette } from "@/lib/palettes/types";
import { Strata } from "@/components/palette/Strata";
import { ExportPanel } from "@/components/palette/ExportPanel";

const EMPTY_CATS = { mood: [], family: [], industry: [], style: [], season: [] };

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

interface Extracted {
  raw: string[];
  baseHue: number;
  chroma: number;
  harmony: Harmony;
}

/** Pull dominant vibrant hues from an image, bucketed in OKLCH. */
function extractFromImage(img: HTMLImageElement): Extracted {
  const W = 120;
  const H = Math.max(1, Math.round((120 * img.height) / img.width));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { raw: [], baseHue: 220, chroma: 0.1, harmony: "Analogous" };
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  const bins = new Map<number, { count: number; cSum: number; sample: OKLCH }>();
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 200) continue;
    const ok = hexToOklch(rgbToHex(data[i], data[i + 1], data[i + 2]));
    if (ok.c < 0.04 || ok.l < 0.2 || ok.l > 0.92) continue;
    const bin = Math.round(ok.h / 30) % 12;
    const e = bins.get(bin) ?? { count: 0, cSum: 0, sample: ok };
    e.count += 1;
    e.cSum += ok.c;
    if (ok.c > e.sample.c) e.sample = ok;
    bins.set(bin, e);
  }

  const sorted = [...bins.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  if (sorted.length === 0) {
    return { raw: [], baseHue: 220, chroma: 0.1, harmony: "Analogous" };
  }
  const raw = sorted.map((e) => toHex(e.sample));
  const baseHue = circularMean(sorted.slice(0, 3).map((e) => e.sample.h));
  const chroma = Math.min(
    0.16,
    Math.max(0.06, sorted.reduce((s, e) => s + e.cSum / e.count, 0) / sorted.length),
  );
  const harmony = classifyHarmony(sorted.map((e) => e.sample));
  return { raw, baseHue, chroma, harmony };
}

export function ExtractTool() {
  const { data: session, status } = useSession();
  const isPro = session?.user?.plan === "pro" || session?.user?.plan === "studio";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [raw, setRaw] = useState<string[]>([]);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [spec, setSpec] = useState<{ name: string; baseHue: number; harmony: Harmony; chroma: number } | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  function onFile(file: File) {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setSaveMsg(null);
    const img = new Image();
    img.onload = () => {
      const ex = extractFromImage(img);
      setRaw(ex.raw);
      const name = file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "From image";
      const s = { name, baseHue: ex.baseHue, harmony: ex.harmony, chroma: ex.chroma };
      setSpec(s);
      setPalette(
        generatePalette(
          { name: s.name, story: "Extracted from an image.", baseHue: s.baseHue, harmony: s.harmony, chroma: s.chroma },
          EMPTY_CATS,
        ),
      );
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function save() {
    if (!spec) return;
    if (status !== "authenticated") {
      setSaveMsg("Sign in to save this palette.");
      return;
    }
    const res = await fetch("/api/generate/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spec),
    });
    if (res.ok) setSaveMsg("Saved to your palettes ✓");
    else if (res.status === 403) setSaveMsg("Saving generated palettes is a Pro feature.");
    else setSaveMsg("Couldn't save.");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f?.type.startsWith("image/")) onFile(f);
        }}
        className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface-2/40 px-6 py-12 text-center"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Uploaded" className="max-h-48 rounded-control object-contain" />
        ) : (
          <p className="text-text-soft">Drop an image here, or choose a file.</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-pill border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors ease-standard hover:bg-surface-2"
        >
          {imageUrl ? "Choose another image" : "Choose image"}
        </button>
      </div>

      {raw.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-text-muted">Dominant colours from your image</span>
          <Strata hexes={raw} className="h-12" />
        </div>
      ) : null}

      {palette ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-text-muted">Your accessible palette</span>
            <Strata hexes={palette.swatches.map((s) => s.hex)} className="h-40" />
          </div>
          <p className="text-text-soft">{palette.why.rationale}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={save}
              
            >
              Save palette
            </Button>
            {saveMsg ? <span className="text-sm text-text-soft">{saveMsg}</span> : null}
          </div>

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
        </div>
      ) : (
        <p className="text-text-muted">
          Upload a brand photo, screenshot or artwork — Open Air pulls the colours and
          turns them into a harmonious, WCAG-AA palette.{" "}
          <Link href="/pricing" className="underline underline-offset-4">Go Pro</Link> to save and unlock every export.
        </p>
      )}
    </div>
  );
}
