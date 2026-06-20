import { describe, expect, it } from "vitest";
import { canonicalEmail, isAdminEmail, parseAdminEmails } from "../lib/admin";

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

describe("canonicalEmail", () => {
  it("ignores Gmail dots and +tags", () => {
    expect(canonicalEmail("Dennis.Ramara+admin@gmail.com")).toBe("dennisramara@gmail.com");
    expect(canonicalEmail("dennisramara@googlemail.com")).toBe("dennisramara@googlemail.com");
  });
  it("keeps dots for non-Gmail domains but still drops +tags", () => {
    expect(canonicalEmail("a.b+work@company.com")).toBe("a.b@company.com");
  });
});

describe("isAdminEmail", () => {
  const allow = parseAdminEmails("dennis.ramara@gmail.com");
  it("matches the admin regardless of Gmail dots/tags or case (any provider)", () => {
    expect(isAdminEmail("dennis.ramara@gmail.com", allow)).toBe(true);
    expect(isAdminEmail("dennisramara@gmail.com", allow)).toBe(true); // Google may return no dots
    expect(isAdminEmail("DennisRamara+admin@Gmail.com", allow)).toBe(true);
  });
  it("rejects everyone else and empty values", () => {
    expect(isAdminEmail("someone@else.com", allow)).toBe(false);
    expect(isAdminEmail("dennismmachoene@gmail.com", allow)).toBe(false); // different inbox
    expect(isAdminEmail(null, allow)).toBe(false);
    expect(isAdminEmail("", allow)).toBe(false);
  });
});
