"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseHexList } from "@/lib/color/repair";
import { bestOn } from "@/lib/color/contrast";
import { Strata } from "@/components/palette/Strata";
import { LICENSES } from "@/lib/publish";
import { clsx } from "@/lib/cn";

const VIS = [
  { id: "public", label: "Public — appears in Explore" },
  { id: "unlisted", label: "Unlisted — only people with the link" },
  { id: "private", label: "Private — only you" },
] as const;

function a11yScore(hexes: string[]): number {
  if (hexes.length === 0) return 0;
  const readable = hexes.filter((h) => bestOn(h).ratio >= 4.5).length;
  return Math.round((readable / hexes.length) * 100);
}

export function PublishForm({ initialColors = "" }: { initialColors?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [colors, setColors] = useState(initialColors);
  const [description, setDescription] = useState("");
  const [rationale, setRationale] = useState("");
  const [license, setLicense] = useState<string>("all-rights-reserved");
  const [visibility, setVisibility] = useState<string>("public");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hexes = useMemo(() => parseHexList(colors), [colors]);
  const score = useMemo(() => a11yScore(hexes), [hexes]);
  const valid = name.trim().length > 0 && hexes.length >= 2;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          hexes,
          description: description.trim(),
          rationale: rationale.trim(),
          a11yScore: score,
          license,
          visibility,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't publish.");
        return;
      }
      router.push(`/s/${data.slug}`);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {hexes.length >= 2 ? <Strata hexes={hexes} className="h-24" /> : null}

      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Tidewater" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Colors (paste hex values)
        <textarea value={colors} onChange={(e) => setColors(e.target.value)} rows={2} spellCheck={false} placeholder="#0ea5e9 #0369a1 #082f49" className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none focus-visible:border-text" />
        <span className="text-xs text-text-muted">{hexes.length} colors · accessibility {score}/100</span>
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Description <span className="text-text-muted">(optional)</span>
        <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Why it works <span className="text-text-muted">(optional)</span>
        <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} maxLength={500} rows={2} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-text-soft">
          License
          <select value={license} onChange={(e) => setLicense(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text">
            {LICENSES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-soft">
          Visibility
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text">
            {VIS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Tags <span className="text-text-muted">(comma-separated, optional)</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="wellness, calm, dark-ui" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text" />
      </label>

      {error ? <p className="text-sm text-p-danger">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={!valid || busy} className={clsx("rounded-full bg-text px-6 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90", (!valid || busy) && "opacity-40")}>
          {busy ? "Publishing…" : "Publish"}
        </button>
        <span className="text-xs text-text-muted">You keep ownership; the license tells others how they may use it.</span>
      </div>
    </form>
  );
}
