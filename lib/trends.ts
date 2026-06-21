import type { Palette } from "./palettes/types";

export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

/** Current aesthetic season (Northern-hemisphere convention for design palettes). */
export function currentSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m <= 1 || m === 11) return "Winter";
  if (m <= 4) return "Spring";
  if (m <= 7) return "Summer";
  return "Autumn";
}

const byPopularity = (a: Palette, b: Palette) => b.popularity - a.popularity;

/** Most popular palettes overall. */
export function trendingPalettes(all: Palette[], n = 8): Palette[] {
  return [...all].sort(byPopularity).slice(0, n);
}

/** Most popular palettes tagged for a season. */
export function seasonalPalettes(all: Palette[], season: Season, n = 8): Palette[] {
  return all
    .filter((p) => p.categories.season.includes(season))
    .sort(byPopularity)
    .slice(0, n);
}

export interface IndustryTrend {
  industry: string;
  leaders: Palette[];
}

/** Top palettes per industry, industries ordered by catalog presence. */
export function industryTrends(all: Palette[], perIndustry = 4): IndustryTrend[] {
  const counts = new Map<string, number>();
  for (const p of all) for (const ind of p.categories.industry) counts.set(ind, (counts.get(ind) ?? 0) + 1);
  return [...counts.keys()]
    .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
    .map((industry) => ({
      industry,
      leaders: all.filter((p) => p.categories.industry.includes(industry)).sort(byPopularity).slice(0, perIndustry),
    }));
}

export interface Distribution {
  label: string;
  count: number;
  share: number; // 0..1
}

function distribution(all: Palette[], pick: (p: Palette) => string[]): Distribution[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const p of all) for (const v of pick(p)) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
    total++;
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, share: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count);
}

/** Harmony mix across the catalog — a proxy for color "movements". */
export function harmonyDistribution(all: Palette[]): Distribution[] {
  return distribution(all, (p) => [p.harmony]);
}

/** Color-family mix across the catalog. */
export function familyDistribution(all: Palette[]): Distribution[] {
  return distribution(all, (p) => p.categories.family);
}
