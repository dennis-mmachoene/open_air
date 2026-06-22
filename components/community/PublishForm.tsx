"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseHexList } from "@/lib/color/repair";
import { bestOn } from "@/lib/color/contrast";
import { Strata } from "@/components/palette/Strata";
import { LICENSES } from "@/lib/publish";
import { Button, Input, Select, Textarea, ErrorNote } from "@/components/ui";

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
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Tidewater" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Colors (paste hex values)
        <Textarea value={colors} onChange={(e) => setColors(e.target.value)} rows={2} spellCheck={false} placeholder="#0ea5e9 #0369a1 #082f49" className="font-mono" />
        <span className="text-xs text-text-muted">{hexes.length} colors · accessibility {score}/100</span>
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Description <span className="text-text-muted">(optional)</span>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Why it works <span className="text-text-muted">(optional)</span>
        <Textarea value={rationale} onChange={(e) => setRationale(e.target.value)} maxLength={500} rows={2} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-text-soft">
          License
          <Select value={license} onChange={(e) => setLicense(e.target.value)}>
            {LICENSES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-soft">
          Visibility
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            {VIS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </Select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Tags <span className="text-text-muted">(comma-separated, optional)</span>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="wellness, calm, dark-ui" />
      </label>

      <ErrorNote message={error} />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!valid} loading={busy}>{busy ? "Publishing…" : "Publish"}</Button>
        <span className="text-xs text-text-muted">You keep ownership; the license tells others how they may use it.</span>
      </div>
    </form>
  );
}
