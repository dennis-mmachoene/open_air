import { hueDistance, type OKLCH } from "./convert";

export type Harmony =
  | "Monochromatic"
  | "Analogous"
  | "Complementary"
  | "Split-complementary"
  | "Triadic"
  | "Tetradic"
  | "Polychromatic";

const CHROMA_FLOOR = 0.02; // below this a swatch is treated as neutral/achromatic

/** Group hues that sit within `tol` degrees of each other into clusters. */
function clusterHues(hues: number[], tol: number): number[] {
  if (hues.length === 0) return [];
  const sorted = [...hues].sort((a, b) => a - b);
  const centers: number[] = [];
  let bucket: number[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] <= tol) {
      bucket.push(sorted[i]);
    } else {
      centers.push(circularMean(bucket));
      bucket = [sorted[i]];
    }
  }
  centers.push(circularMean(bucket));
  // merge wrap-around (first and last) if close
  if (
    centers.length > 1 &&
    hueDistance(centers[0], centers[centers.length - 1]) <= tol
  ) {
    centers.pop();
  }
  return centers;
}

export function circularMean(hues: number[]): number {
  let x = 0;
  let y = 0;
  for (const h of hues) {
    x += Math.cos((h * Math.PI) / 180);
    y += Math.sin((h * Math.PI) / 180);
  }
  const a = (Math.atan2(y, x) * 180) / Math.PI;
  return (a + 360) % 360;
}

/** The smallest arc (degrees) that contains every chromatic hue. */
export function hueArc(hues: number[]): number {
  if (hues.length <= 1) return 0;
  const sorted = [...hues].sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 0; i < sorted.length; i++) {
    const next = i === sorted.length - 1 ? sorted[0] + 360 : sorted[i + 1];
    maxGap = Math.max(maxGap, next - sorted[i]);
  }
  return Math.round(360 - maxGap);
}

/** Classify the harmony of a set of OKLCH colors from measured hue geometry. */
export function classifyHarmony(colors: OKLCH[]): Harmony {
  const hues = colors.filter((c) => c.c >= CHROMA_FLOOR).map((c) => c.h);
  if (hues.length <= 1) return "Monochromatic";

  const arc = hueArc(hues);
  if (arc <= 18) return "Monochromatic";
  if (arc <= 50) return "Analogous";

  const clusters = clusterHues(hues, 30);
  if (clusters.length >= 4) return "Tetradic";

  if (clusters.length === 3) {
    const gaps = [
      hueDistance(clusters[0], clusters[1]),
      hueDistance(clusters[1], clusters[2]),
      hueDistance(clusters[0], clusters[2]),
    ];
    const nearTriad = gaps.filter((g) => Math.abs(g - 120) <= 35).length;
    return nearTriad >= 2 ? "Triadic" : "Split-complementary";
  }

  if (clusters.length === 2) {
    const sep = hueDistance(clusters[0], clusters[1]);
    return sep >= 140 ? "Complementary" : "Analogous";
  }

  return "Polychromatic";
}

const HUE_NAMES: { max: number; name: string }[] = [
  { max: 15, name: "red" },
  { max: 45, name: "orange" },
  { max: 70, name: "amber" },
  { max: 100, name: "yellow-green" },
  { max: 150, name: "green" },
  { max: 185, name: "teal" },
  { max: 215, name: "cyan" },
  { max: 255, name: "blue" },
  { max: 290, name: "indigo" },
  { max: 320, name: "violet" },
  { max: 345, name: "magenta" },
  { max: 360, name: "red" },
];

export function hueName(h: number): string {
  const hue = ((h % 360) + 360) % 360;
  return HUE_NAMES.find((b) => hue < b.max)?.name ?? "neutral";
}

export interface Temperature {
  warm: number; // 0..1
  cool: number; // 0..1
  label: "warm" | "cool" | "balanced";
}

/** Warm = reds→yellows + magenta; cool = greens→violets. Chroma-weighted. */
export function temperature(colors: OKLCH[]): Temperature {
  let warm = 0;
  let total = 0;
  for (const c of colors) {
    if (c.c < CHROMA_FLOOR) continue;
    const h = ((c.h % 360) + 360) % 360;
    const isWarm = h < 90 || h >= 330;
    warm += isWarm ? c.c : 0;
    total += c.c;
  }
  if (total === 0) return { warm: 0.5, cool: 0.5, label: "balanced" };
  const w = warm / total;
  const label = w > 0.6 ? "warm" : w < 0.4 ? "cool" : "balanced";
  return { warm: Math.round(w * 100) / 100, cool: Math.round((1 - w) * 100) / 100, label };
}

export interface Distribution {
  lightnessMin: number;
  lightnessMax: number;
  lightnessRange: number;
  chromaAvg: number;
  dominantHue: string;
}

export function distribution(colors: OKLCH[]): Distribution {
  const ls = colors.map((c) => c.l);
  const chromatic = colors.filter((c) => c.c >= CHROMA_FLOOR);
  const dom = chromatic.length
    ? circularMean(chromatic.map((c) => c.h))
    : 0;
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return {
    lightnessMin: r(Math.min(...ls)),
    lightnessMax: r(Math.max(...ls)),
    lightnessRange: r(Math.max(...ls) - Math.min(...ls)),
    chromaAvg: r(
      chromatic.reduce((s, c) => s + c.c, 0) / Math.max(chromatic.length, 1),
    ),
    dominantHue: hueName(dom),
  };
}
