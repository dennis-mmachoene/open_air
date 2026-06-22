import { createHash } from "node:crypto";

export interface Token {
  name: string;
  hex: string;
}

export type TokenFormat = "dtcg" | "css" | "scss" | "tailwind" | "json";

export const FORMATS: { id: TokenFormat; label: string; ext: string; contentType: string }[] = [
  { id: "dtcg", label: "W3C DTCG", ext: "tokens.json", contentType: "application/json; charset=utf-8" },
  { id: "css", label: "CSS variables", ext: "css", contentType: "text/css; charset=utf-8" },
  { id: "scss", label: "SCSS", ext: "scss", contentType: "text/x-scss; charset=utf-8" },
  { id: "tailwind", label: "Tailwind", ext: "js", contentType: "application/javascript; charset=utf-8" },
  { id: "json", label: "Flat JSON", ext: "json", contentType: "application/json; charset=utf-8" },
];

export function isTokenFormat(v: string | null | undefined): v is TokenFormat {
  return v === "dtcg" || v === "css" || v === "scss" || v === "tailwind" || v === "json";
}

/** Stable, collision-resistant CSS/SCSS variable name. */
function varName(name: string, used: Set<string>): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "color";
  let n = base;
  let i = 2;
  while (used.has(n)) n = `${base}-${i++}`;
  used.add(n);
  return n;
}

/** Tokens with normalized, de-duplicated key names (deterministic order). */
export function keyedTokens(tokens: Token[]): { key: string; hex: string }[] {
  const used = new Set<string>();
  return tokens.map((t) => ({ key: varName(t.name, used), hex: t.hex.toLowerCase() }));
}

export function toDTCG(tokens: Token[]): string {
  const out: Record<string, { $type: "color"; $value: string }> = {};
  for (const { key, hex } of keyedTokens(tokens)) out[key] = { $type: "color", $value: hex };
  return JSON.stringify({ color: out }, null, 2);
}

export function toCSS(tokens: Token[]): string {
  const lines = keyedTokens(tokens).map(({ key, hex }) => `  --${key}: ${hex};`);
  return `:root {\n${lines.join("\n")}\n}\n`;
}

export function toSCSS(tokens: Token[]): string {
  return keyedTokens(tokens).map(({ key, hex }) => `$${key}: ${hex};`).join("\n") + "\n";
}

export function toTailwind(tokens: Token[]): string {
  const colors = keyedTokens(tokens).map(({ key, hex }) => `      '${key}': '${hex}',`).join("\n");
  return `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${colors}\n      },\n    },\n  },\n};\n`;
}

export function toFlatJSON(tokens: Token[]): string {
  const out: Record<string, string> = {};
  for (const { key, hex } of keyedTokens(tokens)) out[key] = hex;
  return JSON.stringify(out, null, 2);
}

export function serializeTokens(tokens: Token[], format: TokenFormat): string {
  switch (format) {
    case "dtcg": return toDTCG(tokens);
    case "css": return toCSS(tokens);
    case "scss": return toSCSS(tokens);
    case "tailwind": return toTailwind(tokens);
    case "json": return toFlatJSON(tokens);
  }
}

/** Content version: a hash over the canonical token set (format-independent). */
export function tokensVersion(tokens: Token[]): string {
  const canonical = JSON.stringify(keyedTokens(tokens));
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

/** Strong ETag for a given format + content. */
export function etagFor(tokens: Token[], format: TokenFormat): string {
  return `"${tokensVersion(tokens)}-${format}"`;
}
