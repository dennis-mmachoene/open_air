import { describe, it, expect } from "vitest";
import { safeWebsite } from "../lib/publish";

describe("safeWebsite (profile URL hardening)", () => {
  it("accepts http and https URLs", () => {
    expect(safeWebsite("https://acme.com")).toBe("https://acme.com/");
    expect(safeWebsite("http://acme.com/x")).toBe("http://acme.com/x");
  });
  it("rejects javascript:, data:, and other schemes (stored-XSS vector)", () => {
    expect(safeWebsite("javascript:alert(document.cookie)")).toBeNull();
    expect(safeWebsite("JavaScript:alert(1)")).toBeNull();
    expect(safeWebsite("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeWebsite("vbscript:msgbox(1)")).toBeNull();
    expect(safeWebsite("ftp://acme.com")).toBeNull();
  });
  it("returns null for empty or malformed input", () => {
    expect(safeWebsite("")).toBeNull();
    expect(safeWebsite("   ")).toBeNull();
    expect(safeWebsite("not a url")).toBeNull();
  });
});
