import { describe, expect, it } from "vitest";
import { generateSemanticTokens, tokensToCss, tokensToJson } from "../lib/color/tokens";
import { contrast } from "../lib/color/contrast";

describe("generateSemanticTokens", () => {
  const t = generateSemanticTokens("#4f46e5");

  it("produces all five groups", () => {
    expect(t.groups.map((g) => g.name)).toEqual(["Brand", "Surfaces", "Text", "States", "Status"]);
  });

  it("every token has valid light + dark hexes", () => {
    for (const g of t.groups)
      for (const tok of g.tokens) {
        expect(tok.light).toMatch(/^#[0-9a-f]{6}$/);
        expect(tok.dark).toMatch(/^#[0-9a-f]{6}$/);
      }
  });

  it("fill tokens carry an on-color whose AA flag matches a real contrast check", () => {
    for (const g of t.groups)
      for (const tok of g.tokens) {
        if (!tok.on) continue;
        expect(tok.aa!.light).toBe(contrast(tok.on.light, tok.light) >= 4.5);
        expect(tok.aa!.dark).toBe(contrast(tok.on.dark, tok.dark) >= 4.5);
      }
  });

  it("body text clears AA on the background in both modes", () => {
    const fg = t.groups.find((g) => g.name === "Text")!.tokens.find((x) => x.name === "foreground")!;
    const bg = t.groups.find((g) => g.name === "Surfaces")!.tokens.find((x) => x.name === "background")!;
    expect(contrast(fg.light, bg.light)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(fg.dark, bg.dark)).toBeGreaterThanOrEqual(4.5);
  });

  it("primary action is readable (on-primary passes AA) in both modes", () => {
    const p = t.groups[0].tokens.find((x) => x.name === "primary")!;
    expect(p.aa!.light).toBe(true);
    expect(p.aa!.dark).toBe(true);
  });

  it("exposes primitive scales for tiered export", () => {
    expect(Object.keys(t.scales)).toEqual(
      expect.arrayContaining(["primary", "neutral", "accent", "success", "warning", "danger", "info"]),
    );
  });
});

describe("token exports", () => {
  const t = generateSemanticTokens("#0ea5e9");
  it("CSS includes semantic + primitive vars and a dark block", () => {
    const css = tokensToCss(t, "sky");
    expect(css).toContain("--sky-primary:");
    expect(css).toContain("--sky-primary-500:");
    expect(css).toContain("prefers-color-scheme: dark");
  });
  it("JSON splits primitives and semantic layers", () => {
    const j = JSON.parse(tokensToJson(t, "sky"));
    expect(j.primitives.primary["500"]).toMatch(/^#[0-9a-f]{6}$/);
    expect(j.semantic.primary).toHaveProperty("light");
  });
});
