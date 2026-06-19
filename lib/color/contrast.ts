import { wcagContrast } from "culori";

export type Grade = "AAA" | "AA" | "AA Large" | "Fail";

/** WCAG 2.1 contrast ratio between two colors (hex or css strings). */
export function contrast(a: string, b: string): number {
  return wcagContrast(a, b);
}

export function grade(ratio: number): Grade {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

export function passesAA(ratio: number, largeText = false): boolean {
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/** Choose the foreground (from candidates) with the most contrast on `bg`. */
export function bestOn(
  bg: string,
  candidates: string[] = ["#ffffff", "#0b0b0c"],
): { color: string; ratio: number } {
  let color = candidates[0];
  let ratio = -1;
  for (const c of candidates) {
    const r = wcagContrast(c, bg);
    if (r > ratio) {
      ratio = r;
      color = c;
    }
  }
  return { color, ratio };
}

export interface Pairing {
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  grade: Grade;
}

export function pairing(label: string, fg: string, bg: string): Pairing {
  const ratio = Math.round(wcagContrast(fg, bg) * 100) / 100;
  return { label, fg, bg, ratio, grade: grade(ratio) };
}
