"use client";

import { useMemo, useState } from "react";
import {
  generateSemanticTokens,
  tokensToCss,
  tokensToTailwind,
  tokensToJson,
  type Mode,
  type SemanticToken,
} from "@/lib/color/tokens";
import { contrastMatrix, type MatrixColor } from "@/lib/color/matrix";
import { clsx } from "@/lib/cn";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;
type Format = "css" | "tailwind" | "json";

// Key colors surfaced in the contrast matrix (resolved per mode).
const MATRIX_KEYS = [
  "background",
  "surface",
  "muted",
  "foreground",
  "foreground-soft",
  "primary",
  "accent",
  "success",
  "danger",
  "info",
];

export function SemanticTokensTool({ initial = "#4f46e5" }: { initial?: string }) {
  const [hex, setHex] = useState(initial);
  const [name, setName] = useState("brand");
  const [mode, setMode] = useState<Mode>("light");
  const [format, setFormat] = useState<Format>("css");
  const [copied, setCopied] = useState(false);

  const valid = HEX_RE.test(hex);
  const normalized = valid ? (hex.startsWith("#") ? hex : `#${hex}`) : null;

  const tokens = useMemo(() => {
    if (!normalized) return null;
    try {
      return generateSemanticTokens(normalized);
    } catch {
      return null;
    }
  }, [normalized]);

  const lookup = useMemo(() => {
    const m = new Map<string, SemanticToken>();
    tokens?.groups.forEach((g) => g.tokens.forEach((t) => m.set(t.name, t)));
    return m;
  }, [tokens]);

  const matrix = useMemo(() => {
    if (!tokens) return null;
    const colors: MatrixColor[] = MATRIX_KEYS.flatMap((key) => {
      const t = lookup.get(key);
      return t ? [{ name: key, hex: t[mode] }] : [];
    });
    return { colors, cells: contrastMatrix(colors) };
  }, [tokens, lookup, mode]);

  const exportText = useMemo(() => {
    if (!tokens) return "";
    if (format === "css") return tokensToCss(tokens, name);
    if (format === "tailwind") return tokensToTailwind(tokens, name);
    return tokensToJson(tokens, name);
  }, [tokens, format, name]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm text-text-soft">
          Brand color
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normalized ?? "#4f46e5"}
              onChange={(e) => setHex(e.target.value)}
              aria-label="Pick brand color"
              className="h-10 w-12 cursor-pointer rounded-control border border-border bg-surface p-1"
            />
            <input
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              spellCheck={false}
              aria-label="Brand color hex"
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
        <div className="inline-flex rounded-pill border border-border p-0.5 text-sm">
          {(["light", "dark"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={clsx(
                "rounded-pill px-3 py-1 capitalize transition-colors",
                m === mode ? "bg-text text-canvas" : "text-text-soft hover:text-text",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        {!tokens ? <p className="text-sm text-p-danger">Enter a 6-digit hex color.</p> : null}
      </div>

      {tokens ? (
        <>
          {/* Token groups */}
          <div className="flex flex-col gap-6">
            {tokens.groups.map((g) => (
              <section key={g.name} className="flex flex-col gap-3">
                <h2 className="font-display text-lg text-text">{g.name}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {g.tokens.map((t) => (
                    <div key={t.name} className="overflow-hidden rounded-control border border-border">
                      <div
                        className="flex h-16 items-center justify-center text-sm font-medium"
                        style={{
                          backgroundColor: t[mode],
                          color: t.on ? t.on[mode] : mode === "light" ? "#0b0b0c" : "#f5f5f4",
                        }}
                      >
                        {t.on ? "Aa" : ""}
                      </div>
                      <div className="flex items-center justify-between gap-1 bg-surface px-2 py-1.5">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-text">{t.name}</p>
                          <p className="truncate font-mono text-[11px] text-text-muted">{t[mode]}</p>
                        </div>
                        {t.aa ? (
                          <span
                            className={clsx(
                              "rounded-pill border px-1.5 py-0.5 text-[10px] font-medium",
                              t.aa[mode] ? "border-border text-text-soft" : "border-p-danger text-p-danger",
                            )}
                          >
                            {t.aa[mode] ? "AA" : "fail"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Contrast matrix */}
          {matrix ? (
            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-lg text-text">Contrast matrix</h2>
                <p className="text-sm text-text-soft">
                  Every key color as foreground × background ({mode} mode). Green ≥ AA, amber ≥ AA-large, red fails.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-canvas p-1 text-left text-text-muted">fg \ bg</th>
                      {matrix.colors.map((c) => (
                        <th key={c.name} className="p-1 text-text-muted">
                          <span className="block h-4 w-8 rounded" style={{ backgroundColor: c.hex }} title={c.name} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.cells.map((row, i) => (
                      <tr key={matrix.colors[i].name}>
                        <th className="sticky left-0 z-10 bg-canvas p-1 text-left font-medium text-text">
                          {matrix.colors[i].name}
                        </th>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            title={`${cell.fg.name} on ${cell.bg.name}: ${cell.ratio}:1 (${cell.grade})`}
                            className={clsx(
                              "p-1 text-center font-mono tabular-nums",
                              cell.aa
                                ? "text-green-700 dark:text-green-400"
                                : cell.grade === "AA Large"
                                  ? "text-amber-700 dark:text-amber-400"
                                  : "text-text-muted",
                            )}
                            style={{ backgroundColor: cell.bg.hex, color: cell.fg.hex }}
                          >
                            {cell.ratio}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {/* Export */}
          <section className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-pill border border-border p-0.5 text-xs">
                {(["css", "tailwind", "json"] as Format[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={clsx(
                      "rounded-pill px-2.5 py-1 capitalize transition-colors",
                      f === format ? "bg-text text-canvas" : "text-text-soft hover:text-text",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={copy}
                className="rounded-pill bg-text px-3 py-1 text-xs font-medium text-canvas transition-opacity hover:opacity-90"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-control bg-canvas p-3 text-xs leading-relaxed text-text-soft">
              <code>{exportText}</code>
            </pre>
          </section>
        </>
      ) : null}
    </div>
  );
}
