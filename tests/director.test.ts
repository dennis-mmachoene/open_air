import { describe, expect, it } from "vitest";
import { localBriefToBase, adjustBase } from "../lib/color/director";
import { parseToOklch } from "../lib/color/convert";

const hueOf = (hex: string) => parseToOklch(hex).h;

describe("localBriefToBase", () => {
  it("maps a healthcare brief to a teal hue", () => {
    const h = hueOf(localBriefToBase("calm healthcare brand").hex);
    expect(h).toBeGreaterThan(160);
    expect(h).toBeLessThan(220);
  });
  it("maps a finance brief to a blue hue", () => {
    const h = hueOf(localBriefToBase("trustworthy fintech bank").hex);
    expect(h).toBeGreaterThan(230);
    expect(h).toBeLessThan(290);
  });
  it("falls back to a valid color for an empty/unknown brief", () => {
    expect(localBriefToBase("xyzzy").hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(localBriefToBase("").hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("adjustBase", () => {
  const base = localBriefToBase("tech saas").hex;
  it("vibrant raises chroma, muted lowers it", () => {
    expect(parseToOklch(adjustBase(base, "vibrant").hex).c).toBeGreaterThan(parseToOklch(base).c);
    expect(parseToOklch(adjustBase(base, "muted").hex).c).toBeLessThan(parseToOklch(base).c);
  });
  it("lighter raises lightness, darker lowers it", () => {
    expect(parseToOklch(adjustBase(base, "lighter").hex).l).toBeGreaterThan(parseToOklch(base).l);
    expect(parseToOklch(adjustBase(base, "darker").hex).l).toBeLessThan(parseToOklch(base).l);
  });
  it("each adjustment returns a valid color and an explanation", () => {
    for (const a of ["warmer", "cooler", "vibrant", "muted", "lighter", "darker", "professional", "playful", "luxurious"] as const) {
      const r = adjustBase(base, a);
      expect(r.hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(r.rationale.length).toBeGreaterThan(0);
    }
  });
});
