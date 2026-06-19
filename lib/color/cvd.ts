import {
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  formatHex,
  parse,
} from "culori";

export type CvdType = "protanopia" | "deuteranopia" | "tritanopia";

const FILTERS = {
  protanopia: filterDeficiencyProt(1),
  deuteranopia: filterDeficiencyDeuter(1),
  tritanopia: filterDeficiencyTrit(1),
};

export const CVD_LABELS: Record<CvdType, string> = {
  protanopia: "Protanopia (no red)",
  deuteranopia: "Deuteranopia (no green)",
  tritanopia: "Tritanopia (no blue)",
};

/** Simulate how a single hex reads under a color-vision deficiency. */
export function simulate(hex: string, type: CvdType): string {
  const parsed = parse(hex);
  if (!parsed) return hex;
  return formatHex(FILTERS[type](parsed)) ?? hex;
}

export function simulatePalette(hexes: string[], type: CvdType): string[] {
  return hexes.map((h) => simulate(h, type));
}
