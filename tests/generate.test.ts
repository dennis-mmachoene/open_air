import { describe, it, expect } from "vitest";
import { generatePalette } from "../lib/palettes/generate";
import type { Harmony } from "../lib/color/harmony";
import { contrast } from "../lib/color/contrast";

const CATS = { mood: [], family: [], industry: [], style: [], season: [] };
const HARMONIES: Harmony[] = [
  "Monochromatic",
  "Analogous",
  "Complementary",
  "Split-complementary",
  "Triadic",
  "Tetradic",
];

describe("generatePalette enforces WCAG AA across the hue wheel", () => {
  for (let hue = 0; hue < 360; hue += 30) {
    for (const harmony of HARMONIES) {
      it(`hue ${hue}deg / ${harmony} clears AA on every core pairing`, () => {
        const p = generatePalette(
          { name: `t-${hue}-${harmony}`, story: "x", baseHue: hue, harmony },
          CATS,
        );
        const L = p.roles.light;
        const D = p.roles.dark;
        expect(contrast(L.text, L.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(L.textSoft, L.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(L.onPrimary, L.primary)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(L.onAccent, L.accent)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(L.onSecondary, L.secondary)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(D.text, D.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(D.onPrimary, D.primary)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("produces 6 swatches and a non-empty rationale", () => {
    const p = generatePalette({ name: "x", story: "x", baseHue: 200, harmony: "Analogous" }, CATS);
    expect(p.swatches).toHaveLength(6);
    expect(p.why.rationale.length).toBeGreaterThan(20);
  });
});
