import type { Harmony } from "../color/harmony";
import type { Pairing } from "../color/contrast";

export interface Swatch {
  name: string;
  hex: string;
  /** Position in the displayed ramp, 0 = lightest. */
  position: number;
}

/** The role contract every Showroom specimen consumes (maps to --p-* tokens). */
export interface Roles {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textSoft: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  onAccent: string;
  ring: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
}

/** role key -> CSS custom property name on the Showroom wrapper. */
export const ROLE_VARS: Record<keyof Roles, string> = {
  bg: "--p-bg",
  surface: "--p-surface",
  surface2: "--p-surface-2",
  border: "--p-border",
  text: "--p-text",
  textSoft: "--p-text-soft",
  textMuted: "--p-text-muted",
  primary: "--p-primary",
  onPrimary: "--p-on-primary",
  secondary: "--p-secondary",
  onSecondary: "--p-on-secondary",
  accent: "--p-accent",
  onAccent: "--p-on-accent",
  ring: "--p-ring",
  success: "--p-success",
  warning: "--p-warning",
  danger: "--p-danger",
  info: "--p-info",
  c1: "--p-c1",
  c2: "--p-c2",
  c3: "--p-c3",
  c4: "--p-c4",
  c5: "--p-c5",
  c6: "--p-c6",
};

/** Turn a role set into a CSS-variable style object for the wrapper element. */
export function rolesToVars(roles: Roles): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(ROLE_VARS) as (keyof Roles)[]) {
    out[ROLE_VARS[key]] = roles[key];
  }
  return out;
}

export interface Categories {
  mood: string[];
  family: string[];
  industry: string[];
  style: string[];
  season: string[];
}

export interface Why {
  rationale: string;
  arc: number;
  harmony: Harmony;
  temperature: { warm: number; cool: number; label: string };
  dominantHue: string;
  contrast: Pairing[];
}

export interface Palette {
  slug: string;
  name: string;
  tagline: string;
  story: string;
  harmony: Harmony;
  dark: boolean;
  isPremium: boolean;
  popularity: number;
  swatches: Swatch[];
  roles: { light: Roles; dark: Roles };
  categories: Categories;
  why: Why;
}

export interface Collection {
  slug: string;
  name: string;
  description: string;
  story: string;
  heroSlug: string;
  paletteSlugs: string[];
}

export interface Snapshot {
  generatedAt: string;
  count: number;
  palettes: Palette[];
  collections: Collection[];
}
