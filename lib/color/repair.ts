import { contrast } from "./contrast";
import { hexToOklch, oklch, toHex } from "./convert";

export interface Repair {
  original: string;
  repaired: string;
  /** Contrast of the original foreground on the background. */
  ratio: number;
  /** Contrast after repair (>= min, or best achievable). */
  newRatio: number;
  changed: boolean;
}

/**
 * Make `fg` legible on `bg` at `min` contrast, preserving its hue and chroma —
 * only lightness is nudged, searching both directions for the nearest fix.
 */
export function repairForContrast(fg: string, bg: string, min = 4.5): Repair {
  const ratio = contrast(fg, bg);
  if (ratio >= min) {
    return { original: fg, repaired: fg, ratio, newRatio: ratio, changed: false };
  }

  const base = hexToOklch(fg);
  let best = fg;
  let bestRatio = ratio;
  let bestSteps = Infinity;

  for (const dir of [1, -1]) {
    for (let i = 1; i <= 50; i++) {
      const l = Math.min(0.99, Math.max(0.02, base.l + dir * i * 0.02));
      const hex = toHex(oklch(l, base.c, base.h));
      const r = contrast(hex, bg);
      if (r >= min) {
        if (i < bestSteps) {
          bestSteps = i;
          best = hex;
          bestRatio = r;
        }
        break;
      }
    }
  }

  // If neither direction reached `min` (rare), keep the most-contrasting result.
  if (bestSteps === Infinity) {
    for (const l of [0.02, 0.99]) {
      const hex = toHex(oklch(l, base.c, base.h));
      const r = contrast(hex, bg);
      if (r > bestRatio) {
        bestRatio = r;
        best = hex;
      }
    }
  }

  return {
    original: fg,
    repaired: best,
    ratio,
    newRatio: bestRatio,
    changed: best.toLowerCase() !== fg.toLowerCase(),
  };
}

/** Parse a free-text blob of hex colours into normalized #rrggbb strings. */
export function parseHexList(input: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of input.matchAll(/#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    let hex = m[1].toLowerCase();
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const v = `#${hex}`;
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}
