import { describe, it, expect } from "vitest";
import { serializeTokens, keyedTokens, tokensVersion, etagFor, toDTCG, type Token } from "../lib/sync/serialize";

const TOKENS: Token[] = [
  { name: "Brand Primary", hex: "#1D4ED8" },
  { name: "Brand Primary", hex: "#f59e0b" }, // duplicate name -> deduped key
  { name: "ink", hex: "#0b1220" },
];

describe("keyedTokens", () => {
  it("kebab-cases and de-duplicates keys deterministically", () => {
    const k = keyedTokens(TOKENS);
    expect(k.map((t) => t.key)).toEqual(["brand-primary", "brand-primary-2", "ink"]);
    expect(k[0].hex).toBe("#1d4ed8"); // lowercased
  });
});

describe("serializeTokens", () => {
  it("DTCG is valid W3C design-token JSON", () => {
    const obj = JSON.parse(toDTCG(TOKENS));
    expect(obj.color["brand-primary"]).toEqual({ $type: "color", $value: "#1d4ed8" });
  });
  it("CSS custom properties", () => {
    expect(serializeTokens(TOKENS, "css")).toContain("--brand-primary: #1d4ed8;");
  });
  it("SCSS variables", () => {
    expect(serializeTokens(TOKENS, "scss")).toContain("$ink: #0b1220;");
  });
  it("Tailwind config exports a colors object", () => {
    const tw = serializeTokens(TOKENS, "tailwind");
    expect(tw).toContain("module.exports");
    expect(tw).toContain("'brand-primary': '#1d4ed8',");
  });
  it("flat JSON maps key -> hex", () => {
    expect(JSON.parse(serializeTokens(TOKENS, "json"))["ink"]).toBe("#0b1220");
  });
});

describe("versioning", () => {
  it("version is stable for the same content and changes when colors change", () => {
    const v1 = tokensVersion(TOKENS);
    expect(v1).toBe(tokensVersion([...TOKENS]));
    const changed = tokensVersion([{ name: "Brand Primary", hex: "#000000" }, TOKENS[1], TOKENS[2]]);
    expect(changed).not.toBe(v1);
  });
  it("etag includes the format so formats don't collide in caches", () => {
    expect(etagFor(TOKENS, "css")).not.toBe(etagFor(TOKENS, "scss"));
  });
});
