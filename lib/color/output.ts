import {
  clampChroma,
  converter,
  differenceEuclidean,
  formatCss,
  formatHex,
  inGamut,
} from "culori";
import { oklch, parseToOklch, toHex } from "./convert";

const toP3 = converter("p3");
const toRgb = converter("rgb");
const oklabDist = differenceEuclidean("oklab");

function round(n: number, d = 0): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** --- Wide gamut (sRGB vs Display P3) ------------------------------------- */

export interface GamutReport {
  /** Input as the browser sees it (sRGB hex). */
  srgbHex: string;
  /** Same color clamped into Display P3, as a CSS `color(display-p3 …)`. */
  p3Css: string;
  /** Is the input already representable in sRGB? (Hex input always is.) */
  inSrgb: boolean;
  inP3: boolean;
  /** Max chroma achievable at this lightness+hue, per gamut. */
  srgbMaxChroma: number;
  p3MaxChroma: number;
  /** Extra vividness P3 affords (0 = none). */
  headroom: number;
  /** The richest in-sRGB and in-P3 versions at this L,h (for side-by-side). */
  srgbMaxHex: string;
  p3MaxCss: string;
  /** True when P3 can show this hue noticeably more vividly than sRGB. */
  widerOnP3: boolean;
}

export function gamutReport(hex: string): GamutReport {
  const o = parseToOklch(hex);
  const base = { mode: "oklch" as const, l: o.l, c: o.c, h: o.h };
  const inSrgb = inGamut("rgb")(base);
  const inP3 = inGamut("p3")(base);

  // Push chroma to each gamut's edge at this lightness + hue.
  const probe = { mode: "oklch" as const, l: o.l, c: 0.5, h: o.h };
  const srgbMax = clampChroma(probe, "oklch", "rgb");
  const p3Max = clampChroma(probe, "oklch", "p3");
  const headroom = round(Math.max(0, (p3Max.c ?? 0) - (srgbMax.c ?? 0)), 3);

  return {
    srgbHex: toHex(o),
    p3Css: formatCss(toP3(clampChroma(base, "oklch", "p3"))),
    inSrgb,
    inP3,
    srgbMaxChroma: round(srgbMax.c ?? 0, 3),
    p3MaxChroma: round(p3Max.c ?? 0, 3),
    headroom,
    srgbMaxHex: formatHex(srgbMax) ?? "#000000",
    p3MaxCss: formatCss(toP3(p3Max)),
    // Only meaningful for reasonably chromatic inputs near the sRGB edge.
    widerOnP3: o.c > 0.08 && headroom >= 0.02,
  };
}

/** --- Print intelligence (CMYK estimate) ---------------------------------- */

export interface PrintReport {
  cmyk: { c: number; m: number; y: number; k: number };
  /** Total ink coverage (TAC) %, sum of CMYK. */
  inkCoverage: number;
  /** Over a typical ~300% sheet-fed limit. */
  heavyInk: boolean;
  /** Estimated appearance once dampened into a press-realistic gamut. */
  previewHex: string;
  /** OKLab shift between screen and estimated print. */
  shift: number;
  /** False when the color is too vivid to reproduce well in CMYK. */
  printable: boolean;
}

/** Standard (naive) sRGB → CMYK conversion, returned as 0–100 percentages. */
export function rgbToCmyk(hex: string): { c: number; m: number; y: number; k: number } {
  const c = toRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const r = c.r ?? 0;
  const g = c.g ?? 0;
  const b = c.b ?? 0;
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: round(((1 - r - k) / (1 - k)) * 100),
    m: round(((1 - g - k) / (1 - k)) * 100),
    y: round(((1 - b - k) / (1 - k)) * 100),
    k: round(k * 100),
  };
}

export function printReport(hex: string): PrintReport {
  const cmyk = rgbToCmyk(hex);
  const inkCoverage = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
  const o = parseToOklch(hex);
  // Press output is less vivid and slightly darker than a backlit screen.
  const previewHex = toHex(oklch(o.l * 0.96, o.c * 0.82, o.h));
  const shift = round(oklabDist(hex, previewHex), 3);
  return {
    cmyk,
    inkCoverage,
    heavyInk: inkCoverage > 300,
    previewHex,
    shift,
    // Very saturated colors sit outside the CMYK gamut.
    printable: o.c < 0.17,
  };
}
