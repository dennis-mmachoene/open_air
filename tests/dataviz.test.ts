import { describe, expect, it } from "vitest";
import {
  OKABE_ITO,
  categorical,
  categoricalReport,
  repairCategorical,
  sequential,
  diverging,
  lightnessOf,
  toCssVars,
} from "../lib/color/dataviz";

describe("categorical", () => {
  it("returns the requested count of valid hexes", () => {
    for (const n of [1, 5, 8, 12, 20]) {
      const c = categorical(n);
      expect(c).toHaveLength(n);
      expect(c.every((x) => /^#[0-9a-f]{6}$/.test(x))).toBe(true);
    }
  });
  it("uses the colorblind-safe Okabe–Ito palette up to 8", () => {
    expect(categorical(5)).toEqual(OKABE_ITO.slice(0, 5));
  });
  it("clamps to 20", () => {
    expect(categorical(50)).toHaveLength(20);
  });
});

describe("categoricalReport", () => {
  it("Okabe–Ito (≤8) is colorblind-safe", () => {
    expect(categoricalReport(categorical(5)).safe).toBe(true);
    expect(categoricalReport(categorical(8)).safe).toBe(true);
  });
  it("flags a palette with duplicate colors", () => {
    const r = categoricalReport(["#3366cc", "#3366cc", "#cc3333"]);
    expect(r.safe).toBe(false);
    expect(r.confusions.length).toBeGreaterThan(0);
  });
  it("reports monochromacy separately (hue-based sets aren't mono-safe)", () => {
    expect(categoricalReport(categorical(8)).monochromeSafe).toBe(false);
  });
});

describe("sequential", () => {
  const s = sequential(7);
  it("has the requested length and all valid hexes", () => {
    expect(s).toHaveLength(7);
    expect(s.every((x) => /^#[0-9a-f]{6}$/.test(x))).toBe(true);
  });
  it("is perceptually ordered (lightness strictly decreases)", () => {
    for (let i = 1; i < s.length; i++) {
      expect(lightnessOf(s[i])).toBeLessThan(lightnessOf(s[i - 1]));
    }
  });
});

describe("diverging", () => {
  const d = diverging(7);
  it("has a light center and dark ends", () => {
    const mid = (d.length - 1) / 2;
    expect(lightnessOf(d[mid])).toBeGreaterThan(lightnessOf(d[0]));
    expect(lightnessOf(d[mid])).toBeGreaterThan(lightnessOf(d[d.length - 1]));
  });
});

describe("exports", () => {
  it("CSS vars list each color", () => {
    expect(toCssVars(["#000000", "#ffffff"], "chart")).toContain("--chart-1: #000000;");
  });
});

describe("repairCategorical", () => {
  it("leaves an already-safe palette unchanged", () => {
    const r = repairCategorical(categorical(5));
    expect(r.changes).toHaveLength(0);
    expect(r.after.safe).toBe(true);
  });
  it("improves a confusable palette and records the changes", () => {
    // three near-identical blues — confusable everywhere
    const bad = ["#3a66cc", "#3f69cf", "#4a6fd2"];
    const r = repairCategorical(bad);
    expect(r.before.safe).toBe(false);
    expect(r.after.minDistance).toBeGreaterThan(r.before.minDistance);
    expect(r.changes.length).toBeGreaterThan(0);
    expect(r.output.every((x) => /^#[0-9a-f]{6}$/.test(x))).toBe(true);
  });
  it("preserves the palette length and order", () => {
    const bad = ["#3a66cc", "#3f69cf", "#4a6fd2"];
    const r = repairCategorical(bad);
    expect(r.output).toHaveLength(bad.length);
  });
});
