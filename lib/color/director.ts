import { oklch, parseToOklch, toHex } from "./convert";

/** A brand intent resolved to a base color + an explanation. */
export interface DirectedColor {
  hex: string;
  rationale: string;
}

interface Intent {
  keywords: string[];
  hue: number;
  chroma: number;
  lightness: number;
  note: string;
}

/** Keyword → color-intent map. Matched intents are averaged. */
const INTENTS: Intent[] = [
  { keywords: ["calm", "serene", "soothing", "gentle", "wellness", "health", "healthcare", "spa", "medical", "care", "mindful"], hue: 190, chroma: 0.09, lightness: 0.58, note: "a calm teal — restorative and clean" },
  { keywords: ["trust", "trustworthy", "finance", "fintech", "bank", "banking", "insurance", "corporate", "professional", "secure", "enterprise"], hue: 250, chroma: 0.11, lightness: 0.5, note: "a dependable blue — stable and credible" },
  { keywords: ["energetic", "bold", "vibrant", "gaming", "sport", "sports", "dynamic", "exciting", "startup"], hue: 30, chroma: 0.18, lightness: 0.58, note: "an energetic red-orange — confident and lively" },
  { keywords: ["premium", "luxury", "luxurious", "elegant", "sophisticated", "exclusive", "high-end"], hue: 300, chroma: 0.1, lightness: 0.42, note: "a deep violet — premium and refined" },
  { keywords: ["playful", "fun", "friendly", "creative", "kids", "child", "quirky", "joyful"], hue: 340, chroma: 0.16, lightness: 0.62, note: "a playful pink-magenta — warm and approachable" },
  { keywords: ["natural", "organic", "eco", "earthy", "sustainable", "outdoor", "nature", "fresh", "green"], hue: 145, chroma: 0.1, lightness: 0.52, note: "a natural green — grounded and fresh" },
  { keywords: ["warm", "cozy", "artisan", "coffee", "food", "hospitality", "rustic", "handmade"], hue: 60, chroma: 0.12, lightness: 0.55, note: "a warm amber — inviting and crafted" },
  { keywords: ["tech", "saas", "software", "modern", "minimal", "digital", "ai", "data"], hue: 265, chroma: 0.13, lightness: 0.52, note: "a modern indigo — crisp and contemporary" },
  { keywords: ["editorial", "fashion", "monochrome", "luxe", "magazine"], hue: 20, chroma: 0.05, lightness: 0.4, note: "a near-neutral espresso — editorial and understated" },
];

const DEFAULT_INTENT: Intent = { keywords: [], hue: 265, chroma: 0.13, lightness: 0.52, note: "a balanced indigo" };

/** Deterministically interpret a brief into a base color (the local fallback,
 *  and the ground truth the AI's output is validated against). */
export function localBriefToBase(brief: string): DirectedColor {
  const text = brief.toLowerCase();
  const matched = INTENTS.filter((i) => i.keywords.some((k) => text.includes(k)));
  const pool = matched.length ? matched : [DEFAULT_INTENT];

  // Average matched intents on the hue circle.
  let x = 0;
  let y = 0;
  let chroma = 0;
  let lightness = 0;
  for (const i of pool) {
    x += Math.cos((i.hue * Math.PI) / 180);
    y += Math.sin((i.hue * Math.PI) / 180);
    chroma += i.chroma;
    lightness += i.lightness;
  }
  const hue = (Math.atan2(y, x) * 180) / Math.PI;
  const base = oklch(lightness / pool.length, chroma / pool.length, (hue + 360) % 360);
  const hex = toHex(base);

  const notes = pool.slice(0, 2).map((i) => i.note);
  const rationale = matched.length
    ? `Chose ${notes.join(" blended with ")}.`
    : "No strong cue in the brief, so a balanced, professional indigo.";
  return { hex, rationale };
}

/** --- Refinement adjustments (instant, explained) ------------------------- */

export type Adjustment =
  | "warmer"
  | "cooler"
  | "vibrant"
  | "muted"
  | "lighter"
  | "darker"
  | "professional"
  | "playful"
  | "luxurious";

export const ADJUSTMENT_LABELS: Record<Adjustment, string> = {
  warmer: "Warmer",
  cooler: "Cooler",
  vibrant: "More vibrant",
  muted: "More muted",
  lighter: "Lighter",
  darker: "Darker",
  professional: "More professional",
  playful: "More playful",
  luxurious: "More luxurious",
};

/** Move hue toward a target along the shorter arc, by up to `amount` degrees. */
function towardHue(h: number, target: number, amount: number): number {
  const diff = ((target - h + 540) % 360) - 180;
  const step = Math.sign(diff) * Math.min(Math.abs(diff), amount);
  return (h + step + 360) % 360;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Apply a named adjustment to a base color, returning the new color + why. */
export function adjustBase(hex: string, adj: Adjustment): DirectedColor {
  const o = parseToOklch(hex);
  let { l, c, h } = o;
  let why = "";
  switch (adj) {
    case "warmer":
      h = towardHue(h, 50, 18);
      why = "rotated the hue toward warm orange";
      break;
    case "cooler":
      h = towardHue(h, 250, 18);
      why = "rotated the hue toward cool blue";
      break;
    case "vibrant":
      c = clamp(c * 1.2, 0, 0.4);
      why = "raised the chroma for more saturation";
      break;
    case "muted":
      c = clamp(c * 0.78, 0, 0.4);
      why = "lowered the chroma for a calmer feel";
      break;
    case "lighter":
      l = clamp(l + 0.06, 0.2, 0.92);
      why = "lifted the lightness";
      break;
    case "darker":
      l = clamp(l - 0.06, 0.2, 0.92);
      why = "deepened the lightness";
      break;
    case "professional":
      h = towardHue(h, 250, 22);
      c = clamp(c * 0.85, 0, 0.4);
      why = "shifted toward a calmer, more credible blue";
      break;
    case "playful":
      h = towardHue(h, 330, 22);
      c = clamp(c * 1.18, 0, 0.4);
      l = clamp(l + 0.04, 0.2, 0.92);
      why = "warmed toward pink and brightened for energy";
      break;
    case "luxurious":
      h = towardHue(h, 295, 20);
      c = clamp(c * 0.9, 0, 0.4);
      l = clamp(l - 0.06, 0.2, 0.92);
      why = "deepened toward a refined violet";
      break;
  }
  return { hex: toHex(oklch(l, c, h)), rationale: `Made it ${adj}: ${why}.` };
}
