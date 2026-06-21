import { describe, expect, it } from "vitest";
import { elevation, elevationToCss } from "../lib/color/elevation";

describe("elevation", () => {
  const levels = elevation("#4f46e5", 5);
  it("returns the requested number of levels with two-layer shadows", () => {
    expect(levels).toHaveLength(5);
    for (const l of levels) {
      expect(l.boxShadow).toContain("rgba(");
      expect(l.boxShadow.split("rgba(").length - 1).toBe(2); // ambient + key
      expect(l.overlay).toMatch(/^rgba\(255, 255, 255, /);
    }
  });
  it("deeper levels cast larger shadows", () => {
    const blur = (s: string) => Number(s.match(/(\d+)px/g)![1].replace("px", ""));
    expect(blur(levels[4].boxShadow)).toBeGreaterThan(blur(levels[0].boxShadow));
  });
  it("exports CSS custom properties", () => {
    expect(elevationToCss(levels)).toContain("--elevation-1:");
  });
});
