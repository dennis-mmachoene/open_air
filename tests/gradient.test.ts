import { describe, expect, it } from "vitest";
import { gradientStops, scanGradient, bestTextFor } from "../lib/color/gradient";
import { parseToOklch } from "../lib/color/convert";

describe("gradientStops", () => {
  it("returns the requested number of valid hexes", () => {
    const s = gradientStops("#ffffff", "#000000", 10);
    expect(s).toHaveLength(10);
    expect(s.every((x) => /^#[0-9a-f]{6}$/.test(x))).toBe(true);
  });
  it("OKLCH keeps the midpoint more colorful than sRGB (no muddy grey)", () => {
    const mid = (arr: string[]) => parseToOklch(arr[Math.floor(arr.length / 2)]).c;
    const ok = mid(gradientStops("#ff0000", "#00ff00", 9, "oklch"));
    const srgb = mid(gradientStops("#ff0000", "#00ff00", 9, "srgb"));
    expect(ok).toBeGreaterThan(srgb);
  });
});

describe("scanGradient", () => {
  it("white text fails on the light end and passes on the dark end", () => {
    const scan = scanGradient("#ffffff", "#000000", "#ffffff", 12);
    expect(scan.stops[0].pass).toBe(false);
    expect(scan.stops[scan.stops.length - 1].pass).toBe(true);
    expect(scan.passRatio).toBeGreaterThan(0);
    expect(scan.passRatio).toBeLessThan(1);
    expect(scan.safeRegions.length).toBeGreaterThan(0);
  });
  it("bestTextFor a dark gradient is white", () => {
    expect(bestTextFor("#1a1a2e", "#16213e").color).toBe("#ffffff");
  });
});
