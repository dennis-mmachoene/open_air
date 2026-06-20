import { describe, expect, it } from "vitest";
import {
  CONDITIONS,
  DISTINGUISH_THRESHOLD,
  stressTest,
  transform,
} from "../lib/color/stress";
import { parseToOklch, oklch, toHex } from "../lib/color/convert";

describe("transform", () => {
  it("normal is identity", () => {
    expect(transform("#4f46e5", "normal")).toBe("#4f46e5");
  });
  it("every condition yields a valid hex", () => {
    for (const c of CONDITIONS) {
      expect(transform("#0ea5e9", c)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
  it("achromatopsia strips all chroma (produces a gray)", () => {
    const o = parseToOklch(transform("#dc2626", "achromatopsia"));
    expect(o.c).toBeLessThan(0.01);
  });
  it("low-light darkens", () => {
    const before = parseToOklch("#4f46e5").l;
    const after = parseToOklch(transform("#4f46e5", "low-light")).l;
    expect(after).toBeLessThan(before);
  });
});

describe("stressTest", () => {
  const textPairs = [
    { name: "text on bg", fg: "#1c1c1a", bg: "#ffffff" }, // strong contrast
    { name: "weak", fg: "#9ca3af", bg: "#ffffff" }, // fails AA
  ];
  // same-lightness red/green: distinguishable normally, collapses under deuteranopia
  const red = toHex(oklch(0.6, 0.15, 27));
  const green = toHex(oklch(0.6, 0.15, 145));
  const categorical = [
    { name: "red", hex: red },
    { name: "green", hex: green },
  ];

  it("covers every condition", () => {
    const r = stressTest(textPairs, categorical);
    expect(r.map((x) => x.condition)).toEqual(CONDITIONS);
  });

  it("normal: strong pair passes, weak fails; reds distinguishable", () => {
    const normal = stressTest(textPairs, categorical).find((x) => x.condition === "normal")!;
    expect(normal.textPass).toBe(1);
    expect(normal.distinguishable).toBe(1);
    expect(normal.confusions[0].distance).toBeGreaterThan(DISTINGUISH_THRESHOLD);
  });

  it("deuteranopia confuses the hue-only red/green pair", () => {
    const deuter = stressTest(textPairs, categorical).find((x) => x.condition === "deuteranopia")!;
    expect(deuter.confusions[0].ok).toBe(false);
    expect(deuter.distinguishable).toBe(0);
  });

  it("score is 0–100 and lower when colors collapse", () => {
    const all = stressTest(textPairs, categorical);
    for (const s of all) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    }
    const normal = all.find((x) => x.condition === "normal")!;
    const deuter = all.find((x) => x.condition === "deuteranopia")!;
    expect(deuter.score).toBeLessThan(normal.score);
  });
});
