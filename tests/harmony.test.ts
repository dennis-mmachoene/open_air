import { describe, it, expect } from "vitest";
import { classifyHarmony } from "../lib/color/harmony";
import { oklch } from "../lib/color/convert";

const c = (h: number) => oklch(0.6, 0.13, h);

describe("classifyHarmony", () => {
  it("detects monochromatic", () => {
    expect(classifyHarmony([c(220), c(220), c(220)])).toBe("Monochromatic");
  });
  it("detects analogous within ~40deg", () => {
    expect(classifyHarmony([c(200), c(215), c(230)])).toBe("Analogous");
  });
  it("detects complementary", () => {
    expect(classifyHarmony([c(30), c(210)])).toBe("Complementary");
  });
  it("detects triadic", () => {
    expect(classifyHarmony([c(0), c(120), c(240)])).toBe("Triadic");
  });
});
