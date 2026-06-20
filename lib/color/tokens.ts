import { oklch, parseToOklch, toHex } from "./convert";
import { bestOn } from "./contrast";
import { generateTonalScale, type TonalScale, type ToneStop } from "./scale";

export type Mode = "light" | "dark";

/** A semantic token resolved for both modes. Fills carry an `on` foreground. */
export interface SemanticToken {
  name: string;
  desc: string;
  light: string;
  dark: string;
  /** Foreground for fills (text/icon drawn on top). Omitted for text/border tokens. */
  on?: { light: string; dark: string };
  /** Whether the on-color clears WCAG AA (4.5) on the fill, per mode. */
  aa?: { light: boolean; dark: boolean };
}

export interface TokenGroup {
  name: string;
  tokens: SemanticToken[];
}

export interface SemanticTokens {
  base: string;
  groups: TokenGroup[];
  /** Primitive tonal scales behind the semantic layer (for tiered export). */
  scales: Record<string, TonalScale>;
}

/** Canonical status hues (OKLCH degrees), kept recognizable across brands. */
const STATUS_HUE = { success: 150, warning: 85, danger: 27, info: 255 } as const;

function stop(scale: TonalScale, s: ToneStop): string {
  return scale.swatches.find((w) => w.stop === s)!.hex;
}

const STOPS: ToneStop[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/** First stop (in preference order) whose best foreground clears AA. */
function readableStop(scale: TonalScale, prefs: ToneStop[]): ToneStop {
  for (const s of prefs) if (bestOn(stop(scale, s)).ratio >= 4.5) return s;
  return 900;
}

/** Shift a stop N steps darker (+) or lighter (−), clamped. */
function shiftStop(s: ToneStop, by: number): ToneStop {
  const i = STOPS.indexOf(s);
  return STOPS[Math.max(0, Math.min(STOPS.length - 1, i + by))];
}

/** A fill token: pick a stop per mode and compute its best foreground + AA. */
function fill(
  name: string,
  desc: string,
  scale: TonalScale,
  lightStop: ToneStop,
  darkStop: ToneStop,
): SemanticToken {
  const light = stop(scale, lightStop);
  const dark = stop(scale, darkStop);
  const onL = bestOn(light);
  const onD = bestOn(dark);
  return {
    name,
    desc,
    light,
    dark,
    on: { light: onL.color, dark: onD.color },
    aa: { light: onL.ratio >= 4.5, dark: onD.ratio >= 4.5 },
  };
}

/** A non-fill token (surface/text/border): just two hexes. */
function plain(name: string, desc: string, light: string, dark: string): SemanticToken {
  return { name, desc, light, dark };
}

/**
 * Generate a complete, brand-harmonized semantic token set from one color.
 * Neutrals are tinted toward the brand hue; status colors adopt the brand's
 * chroma intensity while keeping their canonical hue.
 */
export function generateSemanticTokens(input: string): SemanticTokens {
  const base = parseToOklch(input);

  const brand = generateTonalScale(input);
  // Neutrals: brand hue, near-zero chroma, so surfaces feel "of" the brand.
  const neutral = generateTonalScale(toHex(oklch(0.6, Math.min(base.c, 0.016), base.h)));
  // Secondary: a quieter, lower-chroma brand.
  const secondary = generateTonalScale(toHex(oklch(0.6, base.c * 0.45, base.h)));
  // Accent: complementary hue, brand chroma.
  const accent = generateTonalScale(toHex(oklch(0.62, Math.max(base.c, 0.12), (base.h + 180) % 360)));

  // Status: canonical hue, chroma harmonized to the brand's vividness.
  const statusChroma = Math.min(0.2, Math.max(0.11, base.c));
  const success = generateTonalScale(toHex(oklch(0.6, statusChroma, STATUS_HUE.success)));
  const warning = generateTonalScale(toHex(oklch(0.72, statusChroma, STATUS_HUE.warning)));
  const danger = generateTonalScale(toHex(oklch(0.58, statusChroma, STATUS_HUE.danger)));
  const info = generateTonalScale(toHex(oklch(0.6, statusChroma, STATUS_HUE.info)));

  // Pick readable anchor stops so fills always have AA-legible text.
  const pL = readableStop(brand, [600, 700, 800, 500, 900]);
  const pD = readableStop(brand, [400, 300, 500, 200, 600]);
  const aL = readableStop(accent, [600, 700, 800, 500, 900]);
  const aD = readableStop(accent, [400, 300, 500, 200, 600]);

  const groups: TokenGroup[] = [
    {
      name: "Brand",
      tokens: [
        fill("primary", "Primary action", brand, pL, pD),
        fill("primary-hover", "Primary, hovered", brand, shiftStop(pL, 1), shiftStop(pD, -1)),
        fill("primary-active", "Primary, pressed", brand, shiftStop(pL, 2), shiftStop(pD, -2)),
        fill("secondary", "Secondary action", secondary, 200, 800),
        fill("accent", "Accent / highlight", accent, aL, aD),
      ],
    },
    {
      name: "Surfaces",
      tokens: [
        plain("background", "Page background", stop(neutral, 100), stop(neutral, 950)),
        plain("surface", "Raised surface", stop(neutral, 50), stop(neutral, 900)),
        plain("card", "Card / panel", stop(neutral, 50), stop(neutral, 800)),
        plain("muted", "Muted surface", stop(neutral, 200), stop(neutral, 800)),
        plain("border", "Borders / dividers", stop(neutral, 200), stop(neutral, 700)),
        plain("overlay", "Modal scrim", stop(neutral, 950), stop(neutral, 950)),
      ],
    },
    {
      name: "Text",
      tokens: [
        plain("foreground", "Primary text", stop(neutral, 900), stop(neutral, 50)),
        plain("foreground-soft", "Secondary text", stop(neutral, 700), stop(neutral, 300)),
        plain("foreground-muted", "Muted text", stop(neutral, 500), stop(neutral, 400)),
      ],
    },
    {
      name: "States",
      tokens: [
        fill("focus", "Focus ring", brand, 500, 400),
        fill("selected", "Selected", brand, 100, 900),
        plain("disabled", "Disabled surface", stop(neutral, 200), stop(neutral, 800)),
        plain("disabled-foreground", "Disabled text", stop(neutral, 400), stop(neutral, 600)),
      ],
    },
    {
      name: "Status",
      tokens: [
        fill("success", "Success", success, readableStop(success, [600, 700, 500, 800]), readableStop(success, [400, 500, 300])),
        fill("warning", "Warning", warning, readableStop(warning, [500, 600, 700, 400]), readableStop(warning, [400, 500, 300])),
        fill("danger", "Danger / error", danger, readableStop(danger, [600, 700, 500, 800]), readableStop(danger, [400, 500, 300])),
        fill("info", "Information", info, readableStop(info, [600, 700, 500, 800]), readableStop(info, [400, 500, 300])),
      ],
    },
  ];

  return {
    base: brand.base,
    groups,
    scales: { primary: brand, neutral, secondary, accent, success, warning, danger, info },
  };
}

/** --- Exports (tiered: primitive scales + semantic tokens) ----------------- */

function safe(name: string): string {
  const n = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return n || "brand";
}

function tokensFor(tokens: SemanticTokens, mode: Mode): [string, string][] {
  const out: [string, string][] = [];
  for (const g of tokens.groups) {
    for (const t of g.tokens) {
      out.push([t.name, t[mode]]);
      if (t.on) out.push([`on-${t.name}`, t.on[mode]]);
    }
  }
  return out;
}

export function tokensToCss(tokens: SemanticTokens, name = "brand"): string {
  const p = safe(name);
  const light = tokensFor(tokens, "light").map(([k, v]) => `  --${p}-${k}: ${v};`).join("\n");
  const dark = tokensFor(tokens, "dark").map(([k, v]) => `    --${p}-${k}: ${v};`).join("\n");
  // Primitive scales too (tier 1).
  const scales = Object.entries(tokens.scales)
    .flatMap(([sname, sc]) => sc.swatches.map((w) => `  --${p}-${sname}-${w.stop}: ${w.hex};`))
    .join("\n");
  return `:root {\n${scales}\n${light}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n${dark}\n  }\n}`;
}


export function tokensToTailwind(tokens: SemanticTokens, name = "brand"): string {
  const p = safe(name);
  const semantic = tokens.groups
    .flatMap((g) => g.tokens.flatMap((t) => {
      const lines = [`      "${t.name}": "var(--${p}-${t.name})",`];
      if (t.on) lines.push(`      "on-${t.name}": "var(--${p}-on-${t.name})",`);
      return lines;
    }))
    .join("\n");
  return `// tailwind.config — theme.extend.colors (pair with the CSS export)\n${p}: {\n${semantic}\n}`;
}

export function tokensToJson(tokens: SemanticTokens, name = "brand"): string {
  const p = safe(name);
  const semantic = Object.fromEntries(
    tokens.groups.flatMap((g) =>
      g.tokens.map((t) => [
        t.name,
        { light: t.light, dark: t.dark, ...(t.on ? { on: t.on, aa: t.aa } : {}) },
      ]),
    ),
  );
  const primitives = Object.fromEntries(
    Object.entries(tokens.scales).map(([sname, sc]) => [
      sname,
      Object.fromEntries(sc.swatches.map((w) => [w.stop, w.hex])),
    ]),
  );
  return JSON.stringify({ name: p, base: tokens.base, primitives, semantic }, null, 2);
}
