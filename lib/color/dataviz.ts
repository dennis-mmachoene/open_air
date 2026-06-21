import { differenceEuclidean } from "culori";
import { oklch, parseToOklch, toHex } from "./convert";
import { transform, type Condition } from "./stress";

const oklabDist = differenceEuclidean("oklab");
/** Below this OKLab distance two series colors are hard to tell apart. */
export const SERIES_THRESHOLD = 0.03;

function round(n: number, d = 0): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** --- Categorical (qualitative) ------------------------------------------- */

/**
 * The Okabe–Ito palette — the empirically-validated colorblind-safe categorical
 * set (Okabe & Ito, 2008). Used as the base for up to 8 series.
 */
export const OKABE_ITO = [
  "#e69f00", // orange
  "#56b4e9", // sky blue
  "#009e73", // bluish green
  "#f0e442", // yellow
  "#0072b2", // blue
  "#d55e00", // vermilion
  "#cc79a7", // reddish purple
  "#999999", // gray
];

/**
 * `count` maximally-distinguishable categorical colors. Up to 8 uses the
 * colorblind-safe Okabe–Ito palette; beyond that, evenly-spaced hues with
 * zig-zagging lightness extend it (large categorical sets are inherently harder
 * for CVD — the report tells you which pairs to watch).
 */
export function categorical(count: number, baseHue = 25): string[] {
  const n = Math.max(1, Math.min(20, Math.round(count)));
  if (n <= OKABE_ITO.length) return OKABE_ITO.slice(0, n);
  const out = [...OKABE_ITO];
  const extra = n - OKABE_ITO.length;
  const lights = [0.7, 0.5, 0.6];
  for (let i = 0; i < extra; i++) {
    const h = (baseHue + (i * 360) / extra + 200) % 360;
    out.push(toHex(oklch(lights[i % lights.length], 0.13, h)));
  }
  return out;
}

export interface SeriesConfusion {
  a: number;
  b: number;
  condition: Condition;
  distance: number;
}

export interface CategoricalReport {
  /** Distinguishable under normal + the common CVDs (deuter/protan/trit). */
  safe: boolean;
  /** Also distinguishable under achromatopsia (rare — needs unique lightness). */
  monochromeSafe: boolean;
  /** Worst pairwise distance across the common-CVD conditions. */
  minDistance: number;
  confusions: SeriesConfusion[];
}

// "Colorblind-safe" targets the common deficiencies (~8% of men). Achromatopsia
// (≈1 in 30,000) needs every color to differ in lightness, so it's reported
// separately rather than failing the palette.
const COMMON_CVD: Condition[] = ["normal", "deuteranopia", "protanopia", "tritanopia"];

function confusionsUnder(colors: string[], conditions: Condition[]): {
  confusions: SeriesConfusion[];
  minDistance: number;
} {
  const confusions: SeriesConfusion[] = [];
  let minDistance = Infinity;
  for (const condition of conditions) {
    const sim = colors.map((c) => transform(c, condition));
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const distance = round(oklabDist(sim[i], sim[j]), 3);
        minDistance = Math.min(minDistance, distance);
        if (distance < SERIES_THRESHOLD) confusions.push({ a: i, b: j, condition, distance });
      }
    }
  }
  return { confusions, minDistance: Number.isFinite(minDistance) ? minDistance : 1 };
}

/** Audit a categorical set for distinguishability under normal + CVD vision. */
export function categoricalReport(colors: string[]): CategoricalReport {
  const common = confusionsUnder(colors, COMMON_CVD);
  const mono = confusionsUnder(colors, ["achromatopsia"]);
  return {
    safe: common.confusions.length === 0,
    monochromeSafe: mono.confusions.length === 0,
    minDistance: common.minDistance,
    confusions: common.confusions,
  };
}

/** --- Sequential & diverging (perceptually uniform) ----------------------- */

/** Single-hue ramp, light → dark, with even lightness steps. */
export function sequential(count: number, hue = 255, chroma = 0.13): string[] {
  const n = Math.max(2, Math.round(count));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const l = 0.96 - t * 0.66; // 0.96 → 0.30
    const c = chroma * (0.35 + 0.65 * t); // richer toward the dark end
    out.push(toHex(oklch(l, c, hue)));
  }
  return out;
}

/** Two-hue ramp with a light, near-neutral center. */
export function diverging(count: number, hueLow = 27, hueHigh = 255, chroma = 0.14): string[] {
  const n = Math.max(3, Math.round(count));
  const mid = (n - 1) / 2;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = (i - mid) / mid; // −1 … 0 … 1
    const l = 0.95 - Math.abs(d) * 0.6;
    const c = chroma * Math.abs(d); // neutral center, saturated ends
    const h = d < 0 ? hueLow : hueHigh;
    out.push(toHex(oklch(l, c, h)));
  }
  return out;
}

/** --- Visualization repair ------------------------------------------------ */

export interface RepairChange {
  index: number;
  from: string;
  to: string;
}
export interface RepairResult {
  input: string[];
  output: string[];
  changes: RepairChange[];
  before: CategoricalReport;
  after: CategoricalReport;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Repair an existing categorical palette: nudge only the colors caught in a
 * color-vision confusion (apart in lightness and hue) until the set is
 * distinguishable, preserving the rest of the palette's identity and order.
 */
export function repairCategorical(input: string[], maxIter = 60): RepairResult {
  const before = categoricalReport(input);
  const work = input.map((h) => parseToOklch(h));

  for (let iter = 0; iter < maxIter; iter++) {
    const hexes = work.map((o) => toHex(o));
    const rep = categoricalReport(hexes);
    if (rep.safe) break;
    // Resolve the single worst (closest) confusion each pass.
    const worst = [...rep.confusions].sort((a, b) => a.distance - b.distance)[0];
    const { a: i, b: j } = worst;
    const dir = work[j].l >= work[i].l ? 1 : -1; // push lightness apart
    work[j] = oklch(
      clamp(work[j].l + dir * 0.05, 0.32, 0.84),
      work[j].c,
      work[j].h + dir * 7, // and rotate hue a touch
    );
  }

  const output = work.map((o) => toHex(o));
  const changes: RepairChange[] = [];
  input.forEach((h, k) => {
    if (h.toLowerCase() !== output[k].toLowerCase()) {
      changes.push({ index: k, from: h.toLowerCase(), to: output[k] });
    }
  });

  return { input, output, changes, before, after: categoricalReport(output) };
}

/** --- Exports ------------------------------------------------------------- */

export function toCssVars(colors: string[], name = "series"): string {
  return `:root {\n${colors.map((c, i) => `  --${name}-${i + 1}: ${c};`).join("\n")}\n}`;
}
export function toJsArray(colors: string[], name = "series"): string {
  return `const ${name} = [\n${colors.map((c) => `  "${c}",`).join("\n")}\n];`;
}
export function toJson(colors: string[]): string {
  return JSON.stringify(colors, null, 2);
}

/** True relative luminance ordering helper for tests / sorting. */
export function lightnessOf(hex: string): number {
  return parseToOklch(hex).l;
}
