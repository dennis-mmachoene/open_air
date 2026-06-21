import { describe, expect, it } from "vitest";
import { ALL_PALETTES } from "../lib/palettes/snapshot";
import {
  currentSeason,
  trendingPalettes,
  seasonalPalettes,
  industryTrends,
  harmonyDistribution,
  familyDistribution,
} from "../lib/trends";

describe("currentSeason", () => {
  it("maps months to the four seasons", () => {
    expect(currentSeason(new Date("2026-01-15"))).toBe("Winter");
    expect(currentSeason(new Date("2026-04-15"))).toBe("Spring");
    expect(currentSeason(new Date("2026-07-15"))).toBe("Summer");
    expect(currentSeason(new Date("2026-10-15"))).toBe("Autumn");
  });
});

describe("trending & seasonal", () => {
  it("trending is sorted by popularity, descending", () => {
    const t = trendingPalettes(ALL_PALETTES, 6);
    expect(t).toHaveLength(6);
    for (let i = 1; i < t.length; i++) expect(t[i].popularity).toBeLessThanOrEqual(t[i - 1].popularity);
  });
  it("seasonal returns only palettes for that season", () => {
    const s = seasonalPalettes(ALL_PALETTES, "Summer", 8);
    expect(s.every((p) => p.categories.season.includes("Summer"))).toBe(true);
  });
});

describe("aggregates", () => {
  it("industryTrends lists industries with leaders", () => {
    const it1 = industryTrends(ALL_PALETTES, 4);
    expect(it1.length).toBeGreaterThan(0);
    expect(it1[0].leaders.length).toBeGreaterThan(0);
  });
  it("harmony & family distributions sum their shares to ~1", () => {
    for (const dist of [harmonyDistribution(ALL_PALETTES), familyDistribution(ALL_PALETTES)]) {
      const total = dist.reduce((a, d) => a + d.share, 0);
      expect(total).toBeCloseTo(1, 5);
      expect(dist[0].count).toBeGreaterThanOrEqual(dist[dist.length - 1].count);
    }
  });
});
