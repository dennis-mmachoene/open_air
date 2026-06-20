import { describe, it, expect } from "vitest";
import { parseHexList, repairForContrast } from "../lib/color/repair";
import { contrast } from "../lib/color/contrast";
import { hexToOklch } from "../lib/color/convert";

describe("repairForContrast", () => {
  it("leaves already-compliant colours untouched", () => {
    const r = repairForContrast("#1c1c1a", "#ffffff");
    expect(r.changed).toBe(false);
    expect(r.newRatio).toBeGreaterThanOrEqual(4.5);
  });

  it("repairs a failing pair to >= AA while keeping hue", () => {
    const fg = "#9be7ff"; // light blue on white — fails
    const r = repairForContrast(fg, "#ffffff");
    expect(r.changed).toBe(true);
    expect(r.newRatio).toBeGreaterThanOrEqual(4.5);
    // hue preserved (only lightness moved)
    const a = hexToOklch(r.original);
    const b = hexToOklch(r.repaired);
    expect(Math.abs(a.h - b.h)).toBeLessThan(2);
  });

  it("works on dark backgrounds too", () => {
    const r = repairForContrast("#3b3b3b", "#0b0b0c");
    expect(r.newRatio).toBeGreaterThanOrEqual(4.5);
    expect(contrast(r.repaired, "#0b0b0c")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("parseHexList", () => {
  it("extracts and normalizes hex colours", () => {
    expect(parseHexList("#fff, #1c1c1a  abc123")).toEqual([
      "#ffffff",
      "#1c1c1a",
      "#abc123",
    ]);
  });
});
