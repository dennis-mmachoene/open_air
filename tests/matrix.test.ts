import { describe, expect, it } from "vitest";
import { contrastMatrix, matrixPairs } from "../lib/color/matrix";

const colors = [
  { name: "white", hex: "#ffffff" },
  { name: "black", hex: "#000000" },
  { name: "mid", hex: "#808080" },
];

describe("contrastMatrix", () => {
  const m = contrastMatrix(colors);
  it("is N×N", () => {
    expect(m).toHaveLength(3);
    expect(m[0]).toHaveLength(3);
  });
  it("the diagonal (color on itself) is ratio 1 and fails", () => {
    for (let i = 0; i < colors.length; i++) {
      expect(m[i][i].ratio).toBeCloseTo(1, 1);
      expect(m[i][i].aa).toBe(false);
    }
  });
  it("white on black is the max 21:1, AAA", () => {
    expect(m[0][1].ratio).toBeCloseTo(21, 0);
    expect(m[0][1].aaa).toBe(true);
  });
});

describe("matrixPairs", () => {
  it("returns unique unordered pairs (n choose 2)", () => {
    expect(matrixPairs(colors)).toHaveLength(3);
  });
  it("can be sorted worst-first", () => {
    const sorted = [...matrixPairs(colors)].sort((a, b) => a.ratio - b.ratio);
    expect(sorted[0].ratio).toBeLessThanOrEqual(sorted[sorted.length - 1].ratio);
  });
});
