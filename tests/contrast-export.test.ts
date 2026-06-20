import { describe, it, expect } from "vitest";
import { grade, passesAA } from "../lib/color/contrast";
import { toCssVars, toScss, toTailwindTheme } from "../lib/palettes/export";
import { generatePalette } from "../lib/palettes/generate";

describe("contrast grading", () => {
  it("grades by WCAG thresholds", () => {
    expect(grade(8)).toBe("AAA");
    expect(grade(5)).toBe("AA");
    expect(grade(3.5)).toBe("AA Large");
    expect(grade(2)).toBe("Fail");
  });
  it("passesAA respects large-text rule", () => {
    expect(passesAA(4.5)).toBe(true);
    expect(passesAA(3)).toBe(false);
    expect(passesAA(3, true)).toBe(true);
  });
});

describe("export serializers", () => {
  const roles = generatePalette(
    { name: "x", story: "x", baseHue: 200, harmony: "Analogous" },
    { mood: [], family: [], industry: [], style: [], season: [] },
  ).roles.light;

  it("emits correct CSS custom property names (no double prefix)", () => {
    const css = toCssVars(roles);
    expect(css).toContain("--p-bg:");
    expect(css).toContain("--p-on-primary:");
    expect(css).not.toContain("--p-p-bg");
  });
  it("Tailwind theme uses --color-p-* and SCSS uses $p-*", () => {
    expect(toTailwindTheme(roles)).toContain("--color-p-primary:");
    expect(toScss(roles)).toContain("$p-bg:");
  });
});
