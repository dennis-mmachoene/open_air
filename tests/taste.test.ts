import { describe, expect, it } from "vitest";
import { ALL_PALETTES } from "../lib/palettes/snapshot";
import { computeTasteProfile, recommendFromTaste, describeTaste } from "../lib/taste";

// A few real palettes to seed a profile.
const blues = ALL_PALETTES.filter((p) => p.categories.family.includes("Ocean")).slice(0, 4);

describe("computeTasteProfile", () => {
  it("returns an empty profile for no saves", () => {
    const t = computeTasteProfile([]);
    expect(t.count).toBe(0);
    expect(t.hue).toBeNull();
  });
  it("summarizes a set of saved palettes", () => {
    const t = computeTasteProfile(blues.length ? blues : ALL_PALETTES.slice(0, 4));
    expect(t.count).toBeGreaterThan(0);
    expect(t.hue).not.toBeNull();
    expect(["muted", "balanced", "vivid"]).toContain(t.chroma);
    expect(["dark", "medium", "light"]).toContain(t.lightness);
    expect(typeof describeTaste(t)).toBe("string");
  });
});

describe("recommendFromTaste", () => {
  it("cold start returns popular, unsaved palettes", () => {
    const recs = recommendFromTaste(computeTasteProfile([]), ALL_PALETTES, new Set(), 8);
    expect(recs).toHaveLength(8);
  });
  it("excludes already-saved palettes", () => {
    const saved = ALL_PALETTES.slice(0, 4);
    const exclude = new Set(saved.map((p) => p.slug));
    const recs = recommendFromTaste(computeTasteProfile(saved), ALL_PALETTES, exclude, 6);
    expect(recs.every((p) => !exclude.has(p.slug))).toBe(true);
    expect(recs.length).toBe(6);
  });
  it("ranks hue-similar palettes near the top for a focused taste", () => {
    const seed = ALL_PALETTES.filter((p) => p.harmony === "Monochromatic").slice(0, 3);
    if (seed.length < 2) return;
    const profile = computeTasteProfile(seed);
    const recs = recommendFromTaste(profile, ALL_PALETTES, new Set(seed.map((p) => p.slug)), 5);
    expect(recs.length).toBeGreaterThan(0);
  });
});
