import { differenceEuclidean, formatHex, converter } from "culori";
import { bestOn } from "./contrast";

const oklabDist = differenceEuclidean("oklab");
const toOklch = converter("oklch");
const HEX_RE = /^#[0-9a-f]{6}$/i;

export type Severity = "error" | "warning" | "info";

export interface LintToken {
  name?: string;
  hex: string;
}

export interface Violation {
  rule: string;
  severity: Severity;
  message: string;
  /** Indices into the input list this violation refers to. */
  tokens: number[];
}

export interface LintReport {
  violations: Violation[];
  counts: { error: number; warning: number; info: number };
  /** 0–100; 100 = clean. Errors weigh more than warnings than infos. */
  score: number;
  passed: boolean;
}

export interface LintOptions {
  /** OKLab ΔE below which two distinct colors are "too close". */
  nearThreshold?: number;
  /** Text-contrast a color should support with black or white (default AAA 7:1). */
  minTextContrast?: number;
  /** Enforce kebab-case naming when names are present. */
  enforceNaming?: boolean;
}

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Audit a set of color tokens against accessibility, dedupe, and naming rules. */
export function lintTokens(tokens: LintToken[], options: LintOptions = {}): LintReport {
  const nearThreshold = options.nearThreshold ?? 0.02;
  const minTextContrast = options.minTextContrast ?? 7;
  const enforceNaming = options.enforceNaming ?? false;
  const violations: Violation[] = [];

  const label = (i: number) => tokens[i]?.name?.trim() || tokens[i]?.hex || `#${i + 1}`;
  const valid: number[] = [];

  // 1. Invalid hex (error).
  tokens.forEach((t, i) => {
    if (!HEX_RE.test(t.hex)) {
      violations.push({ rule: "invalid-hex", severity: "error", message: `${label(i)} is not a valid 6-digit hex color.`, tokens: [i] });
    } else {
      valid.push(i);
    }
  });

  // 2. Exact duplicates (warning) + 3. near-duplicates (warning).
  for (let a = 0; a < valid.length; a++) {
    for (let b = a + 1; b < valid.length; b++) {
      const i = valid[a];
      const j = valid[b];
      const hi = tokens[i].hex.toLowerCase();
      const hj = tokens[j].hex.toLowerCase();
      if (hi === hj) {
        violations.push({ rule: "duplicate-color", severity: "warning", message: `${label(i)} and ${label(j)} are the same color (${hi}).`, tokens: [i, j] });
        continue;
      }
      const d = oklabDist(hi, hj);
      if (d < nearThreshold) {
        violations.push({ rule: "near-duplicate", severity: "warning", message: `${label(i)} and ${label(j)} are nearly identical (ΔE ${d.toFixed(3)}) — they may be confused.`, tokens: [i, j] });
      }
    }
  }

  // 4. Can't carry high-contrast (AAA) text in black or white (info).
  for (const i of valid) {
    const best = bestOn(tokens[i].hex);
    if (best.ratio < minTextContrast) {
      violations.push({ rule: "weak-text-contrast", severity: "info", message: `${label(i)} can't carry AAA text — best is ${best.ratio.toFixed(2)}:1 with ${best.color}.`, tokens: [i] });
    }
  }

  // 5. Out-of-sRGB-gamut chroma that will clip on standard displays (info).
  for (const i of valid) {
    const oklch = toOklch(tokens[i].hex);
    if (oklch && (oklch.c ?? 0) > 0.30) {
      violations.push({ rule: "high-chroma", severity: "info", message: `${label(i)} is very saturated (C ${(oklch.c ?? 0).toFixed(2)}) and may shift on wide-gamut displays.`, tokens: [i] });
    }
  }

  // 6. Naming rules (warning/info) when names are present.
  const named = tokens.map((t, i) => ({ i, name: t.name?.trim() })).filter((x) => x.name);
  const seenNames = new Map<string, number>();
  for (const { i, name } of named) {
    const key = name!.toLowerCase();
    if (seenNames.has(key)) {
      violations.push({ rule: "duplicate-name", severity: "warning", message: `The name "${name}" is used more than once.`, tokens: [seenNames.get(key)!, i] });
    } else {
      seenNames.set(key, i);
    }
    if (enforceNaming && !NAME_RE.test(name!)) {
      violations.push({ rule: "naming-convention", severity: "info", message: `"${name}" isn't kebab-case (e.g. brand-primary).`, tokens: [i] });
    }
  }

  const counts = { error: 0, warning: 0, info: 0 };
  for (const v of violations) counts[v.severity]++;
  const penalty = counts.error * 25 + counts.warning * 8 + counts.info * 2;
  const score = Math.max(0, 100 - penalty);
  return { violations, counts, score, passed: counts.error === 0 };
}

/** Convenience: lint a flat list of hexes (no names). */
export function lintHexes(hexes: string[], options?: LintOptions): LintReport {
  return lintTokens(hexes.map((hex) => ({ hex })), options);
}

/** Normalize any culori-parseable color to #rrggbb, or null. */
export function normalizeHex(input: string): string | null {
  try {
    const hex = formatHex(input.trim());
    return hex ?? null;
  } catch {
    return null;
  }
}
