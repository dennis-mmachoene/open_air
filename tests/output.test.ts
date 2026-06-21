import { describe, expect, it } from "vitest";
import { gamutReport, printReport, rgbToCmyk } from "../lib/color/output";

describe("gamutReport", () => {
  it("an sRGB hex is in sRGB and in P3", () => {
    const g = gamutReport("#16a34a");
    expect(g.inSrgb).toBe(true);
    expect(g.inP3).toBe(true);
    expect(g.srgbHex).toMatch(/^#[0-9a-f]{6}$/);
    expect(g.p3Css).toMatch(/^color\(display-p3 /);
  });
  it("P3 reaches at least as much chroma as sRGB", () => {
    const g = gamutReport("#16a34a");
    expect(g.p3MaxChroma).toBeGreaterThanOrEqual(g.srgbMaxChroma);
    expect(g.headroom).toBeGreaterThanOrEqual(0);
  });
  it("a vivid green gains vividness on P3; a gray does not", () => {
    expect(gamutReport("#16a34a").widerOnP3).toBe(true);
    expect(gamutReport("#808080").widerOnP3).toBe(false);
  });
});

describe("rgbToCmyk", () => {
  it("pure white is all zeros", () => {
    expect(rgbToCmyk("#ffffff")).toEqual({ c: 0, m: 0, y: 0, k: 0 });
  });
  it("pure black is K=100", () => {
    expect(rgbToCmyk("#000000")).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });
  it("pure red is M+Y, no C", () => {
    const c = rgbToCmyk("#ff0000");
    expect(c.c).toBe(0);
    expect(c.m).toBe(100);
    expect(c.y).toBe(100);
  });
});

describe("printReport", () => {
  it("computes ink coverage and flags very saturated colors", () => {
    const p = printReport("#4f46e5");
    expect(p.inkCoverage).toBe(p.cmyk.c + p.cmyk.m + p.cmyk.y + p.cmyk.k);
    expect(p.printable).toBe(false); // vivid indigo is out of CMYK gamut
    expect(printReport("#9ca3af").printable).toBe(true); // muted gray prints fine
  });
  it("preview is a valid hex and shifts from the screen color", () => {
    const p = printReport("#16a34a");
    expect(p.previewHex).toMatch(/^#[0-9a-f]{6}$/);
    expect(p.shift).toBeGreaterThanOrEqual(0);
  });
});
