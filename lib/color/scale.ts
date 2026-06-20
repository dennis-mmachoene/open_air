import { converter, wcagLuminance } from "culori";
import { oklch, parseToOklch, toHex, type OKLCH } from "./convert";
import { bestOn } from "./contrast";

/** Tonal scale stops, light → dark (Tailwind/Radix convention). */
export const TONE_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ToneStop = (typeof TONE_STOPS)[number];

/**
 * Target OKLCH lightness per stop. A smooth, slightly-eased curve (not linear)
 * tuned to read like a production design-system ramp: airy tints up top, deep
 * shades at the bottom, even visual steps between.
 */
const TARGET_L: Record<ToneStop, number> = {
  50: 0.971, 100: 0.936, 200: 0.885, 300: 0.823, 400: 0.755,
  500: 0.685, 600: 0.591, 700: 0.498, 800: 0.405, 900: 0.312, 950: 0.205,
};

/**
 * Chroma multiplier (relative to the base color's chroma) per stop. Peaks in
 * the mid-tones and tapers at the extremes, because very light and very dark
 * colors can't hold — and don't look good with — high chroma.
 */
const CHROMA_FACTOR: Record<ToneStop, number> = {
  50: 0.20, 100: 0.32, 200: 0.55, 300: 0.78, 400: 0.95,
  500: 1.0, 600: 0.98, 700: 0.9, 800: 0.78, 900: 0.62, 950: 0.45,
};

const toRgb = converter("rgb");
const toHsl = converter("hsl");

export interface ToneSwatch {
  stop: ToneStop;
  hex: string;
  oklch: OKLCH;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  /** WCAG relative luminance, 0 (black) → 1 (white). */
  luminance: number;
  /** Best foreground (black or white) for text on this tone. */
  onColor: string;
  /** Contrast ratio of `onColor` against this tone. */
  onContrast: number;
  aa: boolean;
  aaa: boolean;
}

export interface TonalScale {
  /** Normalised base color (gamut-clamped hex). */
  base: string;
  /** The stop whose lightness is closest to the base color. */
  nearestStop: ToneStop;
  swatches: ToneSwatch[];
}

function round(n: number, d = 0): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** Generate a complete, accessibility-annotated tonal scale from one color. */
export function generateTonalScale(input: string): TonalScale {
  const baseOklch = parseToOklch(input);
  const base = toHex(baseOklch);

  const swatches: ToneSwatch[] = TONE_STOPS.map((stop) => {
    const requested = oklch(TARGET_L[stop], baseOklch.c * CHROMA_FACTOR[stop], baseOklch.h);
    const hex = toHex(requested);
    // Report the *rendered* color (after gamut clamping), not the request.
    const actual = parseToOklch(hex);
    const rgb = toRgb(hex) ?? { r: 0, g: 0, b: 0 };
    const hsl = toHsl(hex) ?? { h: 0, s: 0, l: 0 };
    const fg = bestOn(hex);
    const onContrast = round(fg.ratio, 2);
    return {
      stop,
      hex,
      oklch: { l: round(actual.l, 4), c: round(actual.c, 4), h: round(actual.h, 2) },
      rgb: {
        r: Math.round((rgb.r ?? 0) * 255),
        g: Math.round((rgb.g ?? 0) * 255),
        b: Math.round((rgb.b ?? 0) * 255),
      },
      hsl: {
        h: round(hsl.h ?? 0, 1),
        s: round((hsl.s ?? 0) * 100, 1),
        l: round((hsl.l ?? 0) * 100, 1),
      },
      luminance: round(wcagLuminance(hex), 4),
      onColor: fg.color,
      onContrast,
      aa: onContrast >= 4.5,
      aaa: onContrast >= 7,
    };
  });

  const nearestStop = TONE_STOPS.reduce<ToneStop>(
    (best, s) =>
      Math.abs(TARGET_L[s] - baseOklch.l) < Math.abs(TARGET_L[best] - baseOklch.l) ? s : best,
    TONE_STOPS[0],
  );

  return { base, nearestStop, swatches };
}

/** --- Exports ------------------------------------------------------------- */

function safeName(name: string): string {
  const n = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return n || "brand";
}

export function scaleToCss(scale: TonalScale, name = "brand"): string {
  const key = safeName(name);
  const lines = scale.swatches.map((s) => `  --color-${key}-${s.stop}: ${s.hex};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

export function scaleToTailwind(scale: TonalScale, name = "brand"): string {
  const key = safeName(name);
  const entries = scale.swatches.map((s) => `        ${s.stop}: "${s.hex}",`).join("\n");
  return `// tailwind.config — theme.extend.colors\n${key}: {\n${entries}\n}`;
}

export function scaleToJson(scale: TonalScale, name = "brand"): string {
  const key = safeName(name);
  const obj = {
    name: key,
    base: scale.base,
    nearestStop: scale.nearestStop,
    tones: Object.fromEntries(
      scale.swatches.map((s) => [
        s.stop,
        {
          hex: s.hex,
          oklch: s.oklch,
          rgb: s.rgb,
          hsl: s.hsl,
          luminance: s.luminance,
          on: s.onColor,
          onContrast: s.onContrast,
          aa: s.aa,
          aaa: s.aaa,
        },
      ]),
    ),
  };
  return JSON.stringify(obj, null, 2);
}
