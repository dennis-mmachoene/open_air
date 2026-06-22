import { describe, it, expect } from "vitest";
import { lintTokens, lintHexes, normalizeHex } from "../lib/color/lint";

describe("lintTokens", () => {
  it("a clean, well-named, accessible set passes with a high score", () => {
    const r = lintTokens([
      { name: "brand-primary", hex: "#1d4ed8" },
      { name: "brand-ink", hex: "#0b1220" },
      { name: "brand-paper", hex: "#f8fafc" },
    ], { enforceNaming: true });
    expect(r.passed).toBe(true);
    expect(r.counts.error).toBe(0);
    expect(r.score).toBeGreaterThanOrEqual(90);
  });

  it("flags an invalid hex as an error and tanks the pass state", () => {
    const r = lintHexes(["#1d4ed8", "not-a-hex"]);
    expect(r.counts.error).toBe(1);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => v.rule === "invalid-hex")).toBe(true);
  });

  it("detects exact duplicates and near-duplicates", () => {
    const dup = lintHexes(["#1d4ed8", "#1D4ED8"]);
    expect(dup.violations.some((v) => v.rule === "duplicate-color")).toBe(true);

    const near = lintHexes(["#1d4ed8", "#1e4fd9"]); // a hair apart
    expect(near.violations.some((v) => v.rule === "near-duplicate")).toBe(true);

    const distinct = lintHexes(["#1d4ed8", "#f59e0b"]);
    expect(distinct.violations.some((v) => v.rule.includes("duplicate"))).toBe(false);
  });

  it("flags mid-tones that can't carry AAA text", () => {
    const r = lintHexes(["#808080"]); // best is ~5.3:1 with black, under AAA 7:1
    expect(r.violations.some((v) => v.rule === "weak-text-contrast")).toBe(true);
  });

  it("flags duplicate names and non-kebab naming", () => {
    const r = lintTokens([
      { name: "Primary", hex: "#1d4ed8" },
      { name: "primary", hex: "#f59e0b" },
    ], { enforceNaming: true });
    expect(r.violations.some((v) => v.rule === "duplicate-name")).toBe(true);
    expect(r.violations.some((v) => v.rule === "naming-convention")).toBe(true);
  });

  it("scores monotonically — more problems, lower score", () => {
    const clean = lintHexes(["#1d4ed8", "#f59e0b", "#0b1220"]);
    const messy = lintHexes(["#1d4ed8", "#1d4ed8", "bad", "#808080"]);
    expect(messy.score).toBeLessThan(clean.score);
  });
});

describe("normalizeHex", () => {
  it("normalizes css colors and shorthand to #rrggbb", () => {
    expect(normalizeHex("#fff")).toBe("#ffffff");
    expect(normalizeHex("rebeccapurple")).toBe("#663399");
    expect(normalizeHex("nonsense-xyz")).toBeNull();
  });
});
