import { describe, expect, it } from "vitest";
import {
  TONE_STOPS,
  generateTonalScale,
  scaleToCss,
  scaleToTailwind,
  scaleToJson,
} from "../lib/color/scale";
import { contrast } from "../lib/color/contrast";

describe("generateTonalScale", () => {
  const scale = generateTonalScale("#4f46e5"); // indigo

  it("produces all 11 stops in order", () => {
    expect(scale.swatches.map((s) => s.stop)).toEqual([...TONE_STOPS]);
  });

  it("is monotonically darker from 50 → 950 (luminance strictly decreases)", () => {
    const lum = scale.swatches.map((s) => s.luminance);
    for (let i = 1; i < lum.length; i++) {
      expect(lum[i]).toBeLessThan(lum[i - 1]);
    }
  });

  it("every stop is a valid 6-digit sRGB hex (in gamut)", () => {
    for (const s of scale.swatches) {
      expect(s.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("reports the correct best foreground and AA/AAA for each tone", () => {
    for (const s of scale.swatches) {
      const expected = contrast(s.onColor, s.hex);
      expect(Math.abs(expected - s.onContrast)).toBeLessThan(0.02);
      expect(s.aa).toBe(s.onContrast >= 4.5);
      expect(s.aaa).toBe(s.onContrast >= 7);
    }
  });

  it("light tints take dark text and dark shades take light text", () => {
    const t50 = scale.swatches.find((s) => s.stop === 50)!;
    const t900 = scale.swatches.find((s) => s.stop === 900)!;
    expect(contrast("#0b0b0c", t50.hex)).toBeGreaterThan(contrast("#ffffff", t50.hex));
    expect(contrast("#ffffff", t900.hex)).toBeGreaterThan(contrast("#0b0b0c", t900.hex));
  });

  it("maps the base color to a nearest stop", () => {
    expect(TONE_STOPS).toContain(scale.nearestStop);
  });

  it("works for grays (achromatic input)", () => {
    const g = generateTonalScale("#808080");
    expect(g.swatches).toHaveLength(11);
    expect(g.swatches.every((s) => /^#[0-9a-f]{6}$/.test(s.hex))).toBe(true);
  });
});

describe("scale exports", () => {
  const scale = generateTonalScale("#0ea5e9");
  it("CSS export lists every stop as a custom property", () => {
    const css = scaleToCss(scale, "Sky Brand");
    expect(css).toContain("--color-sky-brand-500:");
    expect(css.match(/--color-sky-brand-\d+:/g)).toHaveLength(11);
  });
  it("Tailwind export is keyed by stop", () => {
    expect(scaleToTailwind(scale, "sky")).toContain('500: "');
  });
  it("JSON export round-trips and includes accessibility data", () => {
    const parsed = JSON.parse(scaleToJson(scale, "sky"));
    expect(Object.keys(parsed.tones)).toHaveLength(11);
    expect(parsed.tones["500"]).toHaveProperty("aa");
  });
});
