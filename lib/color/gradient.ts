import { formatHex, interpolate, wcagContrast } from "culori";

export type GradientSpace = "oklch" | "oklab" | "srgb";

function mode(space: GradientSpace): "oklch" | "oklab" | "rgb" {
  return space === "srgb" ? "rgb" : space;
}

function round(n: number, d = 0): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** Even color stops between two endpoints, interpolated in the chosen space.
 *  OKLCH/OKLab avoid the muddy grey midpoints that sRGB interpolation produces. */
export function gradientStops(
  from: string,
  to: string,
  steps = 12,
  space: GradientSpace = "oklch",
): string[] {
  const interp = interpolate([from, to], mode(space));
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    out.push(formatHex(interp(t)) ?? "#000000");
  }
  return out;
}

export interface ScanStop {
  t: number;
  hex: string;
  ratio: number;
  pass: boolean;
}

export interface GradientScan {
  stops: ScanStop[];
  /** Contiguous [start,end] ranges (0–1) where the text color clears AA. */
  safeRegions: [number, number][];
  passRatio: number;
  worstRatio: number;
}

/** Scan a gradient for where `textColor` stays readable (WCAG AA) on top of it. */
export function scanGradient(
  from: string,
  to: string,
  textColor: string,
  steps = 24,
  space: GradientSpace = "oklch",
): GradientScan {
  const interp = interpolate([from, to], mode(space));
  const stops: ScanStop[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const hex = formatHex(interp(t)) ?? "#000000";
    const ratio = round(wcagContrast(textColor, hex), 2);
    stops.push({ t: round(t, 3), hex, ratio, pass: ratio >= 4.5 });
  }

  const safeRegions: [number, number][] = [];
  let start: number | null = null;
  stops.forEach((s, i) => {
    if (s.pass && start === null) start = s.t;
    if (!s.pass && start !== null) {
      safeRegions.push([start, stops[i - 1].t]);
      start = null;
    }
  });
  if (start !== null) safeRegions.push([start, stops[stops.length - 1].t]);

  const passCount = stops.filter((s) => s.pass).length;
  return {
    stops,
    safeRegions,
    passRatio: round(passCount / stops.length, 3),
    worstRatio: Math.min(...stops.map((s) => s.ratio)),
  };
}

/** Whichever of white/black text stays readable across more of the gradient. */
export function bestTextFor(
  from: string,
  to: string,
  space: GradientSpace = "oklch",
): { color: string; passRatio: number } {
  const white = scanGradient(from, to, "#ffffff", 24, space).passRatio;
  const black = scanGradient(from, to, "#0b0b0c", 24, space).passRatio;
  return white >= black
    ? { color: "#ffffff", passRatio: white }
    : { color: "#0b0b0c", passRatio: black };
}
