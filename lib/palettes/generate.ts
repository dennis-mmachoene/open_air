import {
  hexToOklch,
  hueDistance,
  oklch,
  toHex,
  withL,
  type OKLCH,
} from "../color/convert";
import { bestOn, contrast, pairing } from "../color/contrast";
import {
  classifyHarmony,
  hueArc,
  hueName,
  temperature,
  type Harmony,
} from "../color/harmony";
import type { Categories, Palette, Roles, Swatch, Why } from "./types";

export interface PaletteSpec {
  name: string;
  story: string;
  baseHue: number;
  harmony: Harmony;
  /** Per-palette chroma key (0.08 muted .. 0.16 vivid). Default 0.12. */
  chroma?: number;
  dark?: boolean;
  premium?: boolean;
  popularity?: number;
  /** Extra mood tags layered on the collection defaults. */
  moods?: string[];
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Hue offsets (relative to base) for the 6 display stops, per harmony. */
function harmonyOffsets(harmony: Harmony): number[] {
  switch (harmony) {
    case "Monochromatic":
      return [0, 0, 0, 0, 0, 0];
    case "Analogous":
      return [-20, -12, -4, 4, 12, 20];
    case "Complementary":
      return [0, 14, -14, 180, 194, 166];
    case "Split-complementary":
      return [0, 12, -12, 150, 210, 168];
    case "Triadic":
      return [0, 120, 240, 12, 132, 252];
    case "Tetradic":
      return [0, 90, 180, 270, 18, 198];
    default:
      return [0, 40, 90, 160, 240, 300];
  }
}

const STOP_L = [0.9, 0.79, 0.67, 0.56, 0.45, 0.34];
const STOP_C = [0.045, 0.09, 0.13, 0.145, 0.125, 0.095];

function lightnessWord(l: number): string {
  if (l > 0.82) return "Pale";
  if (l > 0.68) return "Light";
  if (l > 0.54) return "Soft";
  if (l > 0.42) return "Mid";
  if (l > 0.32) return "Deep";
  return "Dark";
}

function buildStops(spec: PaletteSpec): OKLCH[] {
  const offsets = harmonyOffsets(spec.harmony);
  const key = spec.chroma ?? 0.12;
  return offsets.map((off, i) =>
    oklch(STOP_L[i], STOP_C[i] * (key / 0.12), spec.baseHue + off),
  );
}

function toSwatches(stops: OKLCH[]): Swatch[] {
  return [...stops]
    .sort((a, b) => b.l - a.l)
    .map((c, i) => ({
      name: `${lightnessWord(c.l)} ${hueName(c.h)}`,
      hex: toHex(c),
      position: i,
    }));
}

/**
 * Pick a lightness for a chromatic role so that black or white text on it
 * clears WCAG AA (4.5:1). Returns the adjusted color hex + the best text color.
 */
function enforceContrastColor(
  base: OKLCH,
  min = 4.5,
): { color: string; on: string } {
  // Search both lightness directions and take the nearest passing result, so a
  // hue keeps as much of its natural vividness as possible (warm hues lighten to
  // pair with black text; cool hues darken to pair with white).
  let best: { color: string; on: string } | null = null;
  let bestChroma = -1;
  for (const dir of [1, -1]) {
    let col = base;
    for (let i = 0; i <= 36; i++) {
      const hex = toHex(col);
      const on = bestOn(hex);
      if (on.ratio >= min) {
        const resChroma = hexToOklch(hex).c;
        if (resChroma > bestChroma) {
          bestChroma = resChroma;
          best = { color: hex, on: on.color };
        }
        break;
      }
      col = oklch(Math.min(0.95, Math.max(0.1, col.l + dir * 0.025)), col.c, col.h);
    }
  }
  if (best) return best;
  const hex = toHex(base);
  return { color: hex, on: bestOn(hex).color };
}

/** Darken/lighten a neutral text color until it clears `min` on `bg`. */
function enforceTextOn(text: OKLCH, bgHex: string, min: number, dark: boolean): string {
  let col = text;
  for (let i = 0; i < 50; i++) {
    const hex = toHex(col);
    if (contrast(hex, bgHex) >= min) return hex;
    col = withL(col, col.l + (dark ? 0.02 : -0.02));
    col = oklch(Math.min(0.99, Math.max(0.02, col.l)), col.c, col.h);
  }
  return toHex(col);
}

function semantic(hue: number, dark: boolean): string {
  return toHex(oklch(dark ? 0.72 : 0.6, 0.15, hue));
}

interface BuiltRoles {
  roles: Roles;
  primaryHue: number;
  accentHue: number;
}

function buildRoles(spec: PaletteSpec, stops: OKLCH[], dark: boolean): BuiltRoles {
  const base = spec.baseHue;

  // Neutrals tinted with the base hue at very low chroma.
  const nc = 0.006;
  const bg = dark ? oklch(0.16, nc, base) : oklch(0.985, nc, base);
  const surface = dark ? oklch(0.2, nc, base) : oklch(0.998, nc * 0.5, base);
  const surface2 = dark ? oklch(0.24, nc, base) : oklch(0.965, nc, base);
  const border = dark ? oklch(0.32, nc, base) : oklch(0.9, nc, base);
  const bgHex = toHex(bg);

  const text = enforceTextOn(
    dark ? oklch(0.96, 0.01, base) : oklch(0.24, 0.012, base),
    bgHex,
    4.5,
    dark,
  );
  const textSoft = enforceTextOn(
    dark ? oklch(0.74, 0.012, base) : oklch(0.46, 0.014, base),
    bgHex,
    4.5,
    dark,
  );
  const textMuted = enforceTextOn(
    dark ? oklch(0.58, 0.012, base) : oklch(0.6, 0.014, base),
    bgHex,
    3,
    dark,
  );

  // Brand = the stop nearest the anchor hue (most chromatic among them), so the
  // palette's identity stays its base hue even in complementary/triadic sets.
  const nearBase = stops.filter((s) => hueDistance(s.h, base) <= 30);
  const brandStop = (nearBase.length ? nearBase : [...stops]).sort(
    (a, b) => b.c - a.c,
  )[0];
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
  const primaryBase = dark
    ? oklch(clamp(brandStop.l + 0.16, 0.62, 0.8), brandStop.c, brandStop.h)
    : oklch(clamp(brandStop.l, 0.5, 0.7), brandStop.c, brandStop.h);
  const primary = enforceContrastColor(primaryBase);

  // Accent = stop whose hue is farthest from the brand (the harmony partner).
  const accentStop =
    [...stops].sort(
      (a, b) => hueDistance(b.h, brandStop.h) - hueDistance(a.h, brandStop.h),
    )[0] ?? brandStop;
  const accentBase = dark
    ? oklch(clamp(accentStop.l + 0.16, 0.62, 0.8), Math.max(accentStop.c, 0.12), accentStop.h)
    : oklch(clamp(accentStop.l, 0.5, 0.7), Math.max(accentStop.c, 0.12), accentStop.h);
  const accent = enforceContrastColor(accentBase);

  const secondaryStop = oklch(dark ? 0.46 : 0.4, brandStop.c * 0.85, brandStop.h);
  const secondary = enforceContrastColor(secondaryStop);

  // Chart series from the display stops (lighten a touch in dark mode).
  const series = stops.map((c) => toHex(dark ? withL(c, Math.min(0.8, c.l + 0.12)) : c));

  const roles: Roles = {
    bg: bgHex,
    surface: toHex(surface),
    surface2: toHex(surface2),
    border: toHex(border),
    text,
    textSoft,
    textMuted,
    primary: primary.color,
    onPrimary: primary.on,
    secondary: secondary.color,
    onSecondary: secondary.on,
    accent: accent.color,
    onAccent: accent.on,
    ring: primary.color,
    success: semantic(150, dark),
    warning: semantic(70, dark),
    danger: semantic(25, dark),
    info: semantic(250, dark),
    c1: series[0],
    c2: series[1],
    c3: series[2],
    c4: series[3],
    c5: series[4],
    c6: series[5],
  };

  return { roles, primaryHue: hexToOklch(primary.color).h, accentHue: hexToOklch(accent.color).h };
}

const HARMONY_PHRASE: Record<Harmony, string> = {
  Monochromatic: "a single hue stepped through light and shade",
  Analogous: "neighbours on the wheel",
  Complementary: "two hues set opposite each other",
  "Split-complementary": "a base hue answered by the pair beside its opposite",
  Triadic: "three hues evenly spaced around the wheel",
  Tetradic: "two complementary pairs",
  Polychromatic: "a free spread of hues",
};

function buildWhy(
  stops: OKLCH[],
  harmony: Harmony,
  light: Roles,
  baseHue: number,
  primaryHue: number,
  accentHue: number,
): Why {
  const hues = stops.filter((c) => c.c >= 0.02).map((c) => c.h);
  const arc = hueArc(hues);
  const temp = temperature(stops);
  const dom = hueName(baseHue);
  const sep = Math.round(hueDistance(primaryHue, accentHue));

  const blend =
    arc <= 50
      ? "blend without tension"
      : harmony === "Complementary" || harmony === "Triadic"
        ? "hold each other in balance"
        : "stay distinct yet related";

  const accentClause =
    sep >= 90
      ? `The accent sits about ${sep}° away — the single note of contrast that gives the set a focal point.`
      : `The accent stays close in hue, keeping the mood unbroken.`;

  const rationale =
    `These ${stops.length} colours span a ${arc}° arc — ${HARMONY_PHRASE[harmony]} — so they ${blend}. ` +
    `The palette reads ${temp.label}, anchored in ${dom}. ${accentClause} ` +
    `Every text pairing here clears WCAG AA.`;

  return {
    rationale,
    arc,
    harmony,
    temperature: temp,
    dominantHue: dom,
    contrast: [
      pairing("Text on background", light.text, light.bg),
      pairing("Soft text on background", light.textSoft, light.bg),
      pairing("Label on primary", light.onPrimary, light.primary),
      pairing("Label on accent", light.onAccent, light.accent),
    ],
  };
}

export class PaletteGateError extends Error {}

/** Generate a complete, AA-validated palette from a spec + category defaults. */
export function generatePalette(
  spec: PaletteSpec,
  categories: Categories,
): Palette {
  const stops = buildStops(spec);
  const swatches = toSwatches(stops);
  const light = buildRoles(spec, stops, false);
  const dark = buildRoles(spec, stops, true);
  const detected = classifyHarmony(stops);
  const why = buildWhy(stops, detected, light.roles, spec.baseHue, light.primaryHue, light.accentHue);

  // Accessibility gate — publish only if every core pairing passes AA.
  const gate: [string, string, string, number][] = [
    ["text/bg (light)", light.roles.text, light.roles.bg, 4.5],
    ["softText/bg (light)", light.roles.textSoft, light.roles.bg, 4.5],
    ["onPrimary/primary (light)", light.roles.onPrimary, light.roles.primary, 4.5],
    ["onAccent/accent (light)", light.roles.onAccent, light.roles.accent, 4.5],
    ["text/bg (dark)", dark.roles.text, dark.roles.bg, 4.5],
    ["onPrimary/primary (dark)", dark.roles.onPrimary, dark.roles.primary, 4.5],
  ];
  for (const [label, fg, bg, min] of gate) {
    const ratio = contrast(fg, bg);
    if (ratio < min) {
      throw new PaletteGateError(
        `"${spec.name}" failed AA on ${label}: ${ratio.toFixed(2)} < ${min}`,
      );
    }
  }

  const cats: Categories = {
    mood: [...new Set([...categories.mood, ...(spec.moods ?? [])])],
    family: categories.family,
    industry: categories.industry,
    style: categories.style,
    season: categories.season,
  };

  return {
    slug: slugify(spec.name),
    name: spec.name,
    tagline: `${why.temperature.label[0].toUpperCase()}${why.temperature.label.slice(1)} ${why.dominantHue} · ${detected.toLowerCase()}`,
    story: spec.story,
    harmony: detected,
    dark: spec.dark ?? false,
    isPremium: spec.premium ?? false,
    popularity: spec.popularity ?? 0,
    swatches,
    roles: { light: light.roles, dark: dark.roles },
    categories: cats,
    why,
  };
}
