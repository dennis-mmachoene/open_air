import { describe, expect, it } from "vitest";
import { isAdminEmail } from "../lib/admin";

describe("isAdminEmail", () => {
  it("matches the allow-listed admin (case-insensitive)", () => {
    expect(isAdminEmail("dennism.ramara@gmail.com")).toBe(true);
    expect(isAdminEmail("DENNISM.Ramara@Gmail.com")).toBe(true);
  });
  it("rejects everyone else and empty values", () => {
    expect(isAdminEmail("someone@else.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail("")).toBe(false);
  });
});
