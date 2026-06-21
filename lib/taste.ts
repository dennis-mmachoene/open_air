import type { Palette } from "./palettes/types";
import { hueDistance, parseToOklch } from "./color/convert";
import { circularMean, hueName } from "./color/harmony";

export interface TasteProfile {
  count: number;
  hue: number | null;
  hueLabel: string;
  chroma: "muted" | "balanced" | "vivid";
  lightness: "dark" | "medium" | "light";
  harmonies: string[];
  industries: string[];
  moods: string[];
}

function brandOklch(p: Palette) {
  return parseToOklch(p.roles.light.primary);
}

function topKeys(counts: Map<string, number>, n: number): string[] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

/** Derive a taste profile from the palettes a user has saved. */
export function computeTasteProfile(saved: Palette[]): TasteProfile {
  if (saved.length === 0) {
    return { count: 0, hue: null, hueLabel: "", chroma: "balanced", lightness: "medium", harmonies: [], industries: [], moods: [] };
  }
  const hues: number[] = [];
  let chromaSum = 0;
  let lightSum = 0;
  const harmonies = new Map<string, number>();
  const industries = new Map<string, number>();
  const moods = new Map<string, number>();

  for (const p of saved) {
    const o = brandOklch(p);
    hues.push(o.h);
    chromaSum += o.c;
    lightSum += o.l;
    harmonies.set(p.harmony, (harmonies.get(p.harmony) ?? 0) + 1);
    for (const ind of p.categories.industry) industries.set(ind, (industries.get(ind) ?? 0) + 1);
    for (const m of p.categories.mood) moods.set(m, (moods.get(m) ?? 0) + 1);
  }

  const hue = circularMean(hues);
  const meanC = chromaSum / saved.length;
  const meanL = lightSum / saved.length;

  return {
    count: saved.length,
    hue,
    hueLabel: hueName(hue),
    chroma: meanC < 0.07 ? "muted" : meanC < 0.14 ? "balanced" : "vivid",
    lightness: meanL < 0.45 ? "dark" : meanL < 0.65 ? "medium" : "light",
    harmonies: topKeys(harmonies, 2),
    industries: topKeys(industries, 2),
    moods: topKeys(moods, 2),
  };
}

/** A short human description of the profile. */
export function describeTaste(t: TasteProfile): string {
  if (t.count === 0) return "Save a few palettes and we'll learn your taste.";
  const bits: string[] = [];
  if (t.hue !== null) bits.push(`${t.chroma} ${t.hueLabel}`);
  if (t.moods.length) bits.push(t.moods.join(" & ").toLowerCase());
  if (t.industries.length) bits.push(`often for ${t.industries.join(" & ")}`);
  return `You lean toward ${bits.join(", ")}.`;
}

/** Recommend palettes that match the taste profile (excluding already-saved). */
export function recommendFromTaste(
  profile: TasteProfile,
  all: Palette[],
  excludeSlugs: Set<string>,
  count = 8,
): Palette[] {
  if (profile.count === 0 || profile.hue === null) {
    // Cold start: most popular, unsaved.
    return [...all]
      .filter((p) => !excludeSlugs.has(p.slug))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, count);
  }
  const indSet = new Set(profile.industries);
  const moodSet = new Set(profile.moods);
  const harmSet = new Set(profile.harmonies);

  const scored = all
    .filter((p) => !excludeSlugs.has(p.slug))
    .map((p) => {
      const o = brandOklch(p);
      const hueScore = 1 - hueDistance(o.h, profile.hue as number) / 180; // 0..1
      const harmScore = harmSet.has(p.harmony) ? 0.3 : 0;
      const indScore = p.categories.industry.filter((x) => indSet.has(x)).length * 0.2;
      const moodScore = p.categories.mood.filter((x) => moodSet.has(x)).length * 0.12;
      const pop = p.popularity / 1000;
      return { p, score: hueScore + harmScore + indScore + moodScore + pop };
    });

  return scored.sort((a, b) => b.score - a.score).slice(0, count).map((x) => x.p);
}
