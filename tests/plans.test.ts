import { describe, it, expect } from "vitest";
import { PLAN_FEATURES, isPlan, normalizePlan } from "../lib/plans";

describe("plan matrix", () => {
  it("free is limited to 5 saves and no Pro features", () => {
    expect(PLAN_FEATURES.free.savedLimit).toBe(5);
    expect(PLAN_FEATURES.free.fullShowroom).toBe(false);
    expect(PLAN_FEATURES.free.allExports).toBe(false);
  });
  it("pro is unlimited with the tools, the API, and teams", () => {
    expect(PLAN_FEATURES.pro.savedLimit).toBeNull();
    expect(PLAN_FEATURES.pro.generator).toBe(true);
    expect(PLAN_FEATURES.pro.api).toBe(true);
    expect(PLAN_FEATURES.pro.teams).toBe(true);
    expect(PLAN_FEATURES.pro.teamSeats).toBe(5);
  });
  it("only paid plans can create teams; free gets no seats", () => {
    expect(PLAN_FEATURES.free.teams).toBe(false);
    expect(PLAN_FEATURES.free.teamSeats).toBe(0);
    expect(PLAN_FEATURES.studio.teams).toBe(true);
    expect(PLAN_FEATURES.studio.teamSeats).toBe(25);
  });
  it("normalizePlan/isPlan are strict", () => {
    expect(normalizePlan("garbage")).toBe("free");
    expect(normalizePlan("studio")).toBe("studio");
    expect(isPlan("pro")).toBe(true);
    expect(isPlan(null)).toBe(false);
  });
});
