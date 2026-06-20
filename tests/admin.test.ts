import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails } from "../lib/admin";

describe("parseAdminEmails", () => {
  it("splits, trims, lowercases and drops blanks", () => {
    const set = parseAdminEmails(" A@x.com , b@x.com ,,");
    expect([...set]).toEqual(["a@x.com", "b@x.com"]);
  });
  it("returns an empty set for null/empty", () => {
    expect(parseAdminEmails(null).size).toBe(0);
    expect(parseAdminEmails("").size).toBe(0);
  });
});

describe("isAdminEmail", () => {
  const allow = parseAdminEmails("dennism.ramara@gmail.com");
  it("matches an allow-listed admin, case-insensitively", () => {
    expect(isAdminEmail("dennism.ramara@gmail.com", allow)).toBe(true);
    expect(isAdminEmail("DENNISM.Ramara@Gmail.com", allow)).toBe(true);
  });
  it("rejects everyone else and empty values", () => {
    expect(isAdminEmail("someone@else.com", allow)).toBe(false);
    expect(isAdminEmail(null, allow)).toBe(false);
    expect(isAdminEmail(undefined, allow)).toBe(false);
    expect(isAdminEmail("", allow)).toBe(false);
  });
});
