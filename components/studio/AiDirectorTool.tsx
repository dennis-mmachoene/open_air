"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { generateSemanticTokens, tokensToCss, type SemanticToken } from "@/lib/color/tokens";
import { stressTest, type CategoricalColor, type TextPair } from "@/lib/color/stress";
import { adjustBase, ADJUSTMENT_LABELS, type Adjustment } from "@/lib/color/director";
import { clsx } from "@/lib/cn";

const ADJUSTMENTS = Object.keys(ADJUSTMENT_LABELS) as Adjustment[];
const SAMPLES = ["Calm healthcare brand", "Premium fintech app", "Playful gaming startup", "Warm artisan coffee shop"];

function worstScore(base: string): number {
  const t = generateSemanticTokens(base);
  const m = new Map<string, SemanticToken>();
  t.groups.forEach((g) => g.tokens.forEach((x) => m.set(x.name, x)));
  const h = (n: string) => m.get(n)?.light ?? "#000000";
  const on = (n: string) => m.get(n)?.on?.light ?? "#000000";
  const text: TextPair[] = [
    { name: "text/bg", fg: h("foreground"), bg: h("background") },
    { name: "on-primary", fg: on("primary"), bg: h("primary") },
    { name: "on-danger", fg: on("danger"), bg: h("danger") },
  ];
  const cat: CategoricalColor[] = ["primary", "accent", "success", "warning", "danger", "info"].map((n) => ({ name: n, hex: h(n) }));
  return Math.min(...stressTest(text, cat).map((s) => s.score));
}

export function AiDirectorTool() {
  const [brief, setBrief] = useState("");
  const [base, setBase] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [source, setSource] = useState<"ai" | "local">("local");
  const [refineText, setRefineText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tokens = useMemo(() => (base ? generateSemanticTokens(base) : null), [base]);
  const score = useMemo(() => (base ? worstScore(base) : 0), [base]);

  async function call(body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.hex) {
        setError(data.error === "rate limit exceeded" ? "Slow down a moment and try again." : "Couldn't generate that — try rephrasing.");
        return;
      }
      setBase(data.hex);
      setRationale(data.rationale ?? "");
      setSource(data.source ?? "local");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  function chip(adj: Adjustment) {
    if (!base) return;
    const r = adjustBase(base, adj);
    setBase(r.hex);
    setRationale(r.rationale);
    setSource("local");
  }

  async function copy() {
    if (!tokens) return;
    try {
      await navigator.clipboard.writeText(tokensToCss(tokens, "brand"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Brief */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (brief.trim()) call({ brief: brief.trim() });
        }}
        className="flex flex-col gap-2"
      >
        <label className="flex flex-col gap-1 text-sm text-text-soft">
          Describe your brand
          <div className="flex gap-2">
            <input
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="e.g. modern, trustworthy fintech for young professionals"
              className="min-w-0 flex-1 rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
            />
            <button type="submit" disabled={busy || !brief.trim()} className="rounded-control bg-text px-4 py-2 text-sm font-medium text-canvas disabled:opacity-40">
              {busy ? "Designing…" : "Create system"}
            </button>
          </div>
        </label>
        {!base ? (
          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map((s) => (
              <button key={s} type="button" onClick={() => { setBrief(s); call({ brief: s }); }} className="rounded-pill border border-border px-2.5 py-1 text-xs text-text-soft transition-colors hover:border-text hover:text-text">
                {s}
              </button>
            ))}
          </div>
        ) : null}
        {error ? <p className="text-sm text-p-danger">{error}</p> : null}
      </form>

      {base && tokens ? (
        <>
          {/* Result header */}
          <div className="flex flex-wrap items-center gap-4 rounded-card border border-border bg-surface p-4">
            <div className="h-14 w-14 shrink-0 rounded-control" style={{ backgroundColor: base }} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-text">{base}</span>
                <span className="rounded-pill border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
                  {source === "ai" ? "AI" : "Engine"}
                </span>
                <span className={clsx("rounded-pill border px-2 py-0.5 text-xs font-medium", score >= 80 ? "border-green-600/40 text-green-700 dark:text-green-400" : score >= 60 ? "border-amber-600/40 text-amber-700 dark:text-amber-400" : "border-p-danger text-p-danger")}>
                  a11y {score}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-soft">{rationale}</p>
            </div>
          </div>

          {/* Quick adjust */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-text-soft">Refine</span>
            <div className="flex flex-wrap gap-1.5">
              {ADJUSTMENTS.map((a) => (
                <button key={a} type="button" onClick={() => chip(a)} className="rounded-pill border border-border px-2.5 py-1 text-xs text-text-soft transition-colors hover:border-text hover:text-text">
                  {ADJUSTMENT_LABELS[a]}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (refineText.trim() && base) call({ base, refine: refineText.trim() });
                setRefineText("");
              }}
              className="flex gap-2"
            >
              <input
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder="or describe a change: 'more trustworthy', 'better for finance'…"
                className="min-w-0 flex-1 rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
              />
              <button type="submit" disabled={busy || !refineText.trim()} className="rounded-control border border-border px-3 py-2 text-sm text-text disabled:opacity-40">
                {busy ? "…" : "Apply"}
              </button>
            </form>
          </div>

          {/* System preview */}
          <div className="flex flex-col gap-4">
            {tokens.groups.map((g) => (
              <div key={g.name} className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{g.name}</span>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {g.tokens.map((t) => (
                    <div key={t.name} className="overflow-hidden rounded-control border border-border">
                      <div className="flex h-12 items-center justify-center text-xs font-medium" style={{ backgroundColor: t.light, color: t.on ? t.on.light : "#0b0b0c" }}>
                        {t.on ? "Aa" : ""}
                      </div>
                      <p className="truncate bg-surface px-1.5 py-1 text-[10px] text-text-soft">{t.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Export + deep links */}
          <section className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href={`/studio/tokens`} className="text-text underline underline-offset-4">Open in token tool</Link>
                <Link href={`/studio/stress`} className="text-text-soft underline underline-offset-4 hover:text-text">Stress test</Link>
              </div>
              <button type="button" onClick={copy} className="rounded-pill bg-text px-3 py-1 text-xs font-medium text-canvas transition-opacity hover:opacity-90">
                {copied ? "Copied" : "Copy CSS"}
              </button>
            </div>
          </section>
        </>
      ) : null}

      <p className="text-xs text-text-muted">
        The AI chooses the brand seed color; Open Air&apos;s engine builds the accessible
        tonal scales and tokens around it, so every system is validated for WCAG contrast.
        Quick-adjust chips apply instantly; free-text refinement uses the AI.
      </p>
    </div>
  );
}
