import { differenceEuclidean } from "culori";
import { simulate } from "./cvd";
import { contrast } from "./contrast";
import { oklch, parseToOklch, toHex } from "./convert";

export type Condition =
  | "normal"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "achromatopsia"
  | "low-light"
  | "glare";

export const CONDITIONS: Condition[] = [
  "normal",
  "deuteranopia",
  "protanopia",
  "tritanopia",
  "achromatopsia",
  "low-light",
  "glare",
];

export const CONDITION_LABELS: Record<Condition, string> = {
  normal: "Normal vision",
  deuteranopia: "Deuteranopia (no green)",
  protanopia: "Protanopia (no red)",
  tritanopia: "Tritanopia (no blue)",
  achromatopsia: "Achromatopsia (no color)",
  "low-light": "Low brightness",
  glare: "Outdoor glare",
};

/** Simulate how a single color reads under a viewing/vision condition. */
export function transform(hex: string, c: Condition): string {
  switch (c) {
    case "normal":
      return hex;
    case "protanopia":
    case "deuteranopia":
    case "tritanopia":
      return simulate(hex, c);
    case "achromatopsia": {
      const o = parseToOklch(hex);
      return toHex(oklch(o.l, 0, o.h)); // strip all chroma → pure value
    }
    case "low-light": {
      const o = parseToOklch(hex);
      return toHex(oklch(o.l * 0.7, o.c * 0.85, o.h)); // dim display
    }
    case "glare": {
      const o = parseToOklch(hex);
      return toHex(oklch(0.3 + o.l * 0.7, o.c * 0.8, o.h)); // lifted blacks
    }
  }
}

const oklabDist = differenceEuclidean("oklab");
/** Two colors are "distinguishable" when their OKLab distance clears this. */
export const DISTINGUISH_THRESHOLD = 0.06;

export interface TextPair {
  name: string;
  fg: string;
  bg: string;
}
export interface CategoricalColor {
  name: string;
  hex: string;
}

export interface PairResult {
  name: string;
  fg: string;
  bg: string;
  ratio: number;
  pass: boolean;
}
export interface ConfusionResult {
  a: string;
  b: string;
  hexA: string;
  hexB: string;
  distance: number;
  ok: boolean;
}

export interface ConditionScore {
  condition: Condition;
  /** Transformed categorical swatches (for preview). */
  swatches: CategoricalColor[];
  textPairs: PairResult[];
  textPass: number;
  textTotal: number;
  confusions: ConfusionResult[];
  distinguishable: number;
  pairTotal: number;
  /** 0–100 overall accessibility score under this condition. */
  score: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function scoreCondition(
  condition: Condition,
  textPairs: TextPair[],
  categorical: CategoricalColor[],
): ConditionScore {
  const text: PairResult[] = textPairs.map((p) => {
    const fg = transform(p.fg, condition);
    const bg = transform(p.bg, condition);
    const ratio = round2(contrast(fg, bg));
    return { name: p.name, fg, bg, ratio, pass: ratio >= 4.5 };
  });
  const textPass = text.filter((t) => t.pass).length;

  const swatches: CategoricalColor[] = categorical.map((c) => ({
    name: c.name,
    hex: transform(c.hex, condition),
  }));
  const confusions: ConfusionResult[] = [];
  for (let i = 0; i < swatches.length; i++) {
    for (let j = i + 1; j < swatches.length; j++) {
      const distance = round2(oklabDist(swatches[i].hex, swatches[j].hex));
      confusions.push({
        a: swatches[i].name,
        b: swatches[j].name,
        hexA: swatches[i].hex,
        hexB: swatches[j].hex,
        distance,
        ok: distance >= DISTINGUISH_THRESHOLD,
      });
    }
  }
  const distinguishable = confusions.filter((c) => c.ok).length;

  const textRatio = textPairs.length ? textPass / textPairs.length : 1;
  const distRatio = confusions.length ? distinguishable / confusions.length : 1;
  const score = Math.round((textRatio * 0.6 + distRatio * 0.4) * 100);

  return {
    condition,
    swatches,
    textPairs: text,
    textPass,
    textTotal: textPairs.length,
    confusions,
    distinguishable,
    pairTotal: confusions.length,
    score,
  };
}

/** Run a whole-system stress test across all (or chosen) conditions. */
export function stressTest(
  textPairs: TextPair[],
  categorical: CategoricalColor[],
  conditions: Condition[] = CONDITIONS,
): ConditionScore[] {
  return conditions.map((c) => scoreCondition(c, textPairs, categorical));
}
