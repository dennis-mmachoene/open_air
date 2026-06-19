import { clampChroma, converter, formatHex, inGamut } from "culori";

/** A point in OKLCH space. h is degrees [0,360). */
export interface OKLCH {
  l: number;
  c: number;
  h: number;
}

const toOklch = converter("oklch");

export function oklch(l: number, c: number, h: number): OKLCH {
  return { l, c, h: ((h % 360) + 360) % 360 };
}

export function parseToOklch(input: string): OKLCH {
  const o = toOklch(input);
  if (!o) throw new Error(`Invalid color: ${input}`);
  return { l: o.l ?? 0, c: o.c ?? 0, h: o.h ?? 0 };
}

export const hexToOklch = parseToOklch;

/** Convert OKLCH to a sRGB hex, clamping chroma so the result is renderable. */
export function toHex(color: OKLCH): string {
  const clamped = clampChroma(
    { mode: "oklch", l: color.l, c: color.c, h: color.h },
    "oklch",
  );
  return formatHex(clamped) ?? "#000000";
}

export function withL(c: OKLCH, l: number): OKLCH {
  return { ...c, l };
}
export function withC(c: OKLCH, chroma: number): OKLCH {
  return { ...c, c: chroma };
}
export function rotate(c: OKLCH, deg: number): OKLCH {
  return oklch(c.l, c.c, c.h + deg);
}

export function inSrgb(c: OKLCH): boolean {
  return inGamut("rgb")({ mode: "oklch", l: c.l, c: c.c, h: c.h });
}

/** Smallest absolute angular distance between two hues, in degrees. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
