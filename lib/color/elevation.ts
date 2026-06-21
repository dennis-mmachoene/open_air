import { converter } from "culori";
import { oklch, parseToOklch, toHex } from "./convert";

const toRgb = converter("rgb");

export interface ElevationLevel {
  level: number;
  /** CSS box-shadow (ambient + key, tinted toward the brand hue). */
  boxShadow: string;
  /** Translucent white overlay to lift a surface in dark mode. */
  overlay: string;
}

function rgbTriplet(hex: string): string {
  const c = toRgb(hex) ?? { r: 0, g: 0, b: 0 };
  return `${Math.round((c.r ?? 0) * 255)}, ${Math.round((c.g ?? 0) * 255)}, ${Math.round((c.b ?? 0) * 255)}`;
}

/**
 * A tinted elevation system: each level returns a two-layer box-shadow (a soft
 * ambient layer + a tighter directional/key layer) coloured from the brand hue,
 * plus a surface overlay for raising panels in dark mode.
 */
export function elevation(baseHex: string, levels = 5): ElevationLevel[] {
  const o = parseToOklch(baseHex);
  // Shadow colour: very dark, faintly brand-tinted (not pure black).
  const shadow = rgbTriplet(toHex(oklch(0.16, Math.min(o.c, 0.045), o.h)));

  const out: ElevationLevel[] = [];
  for (let i = 1; i <= levels; i++) {
    const ambientY = Math.round(i * 1.5);
    const ambientBlur = Math.round(i * 3 + 1);
    const keyY = Math.round(i * i * 0.7 + 1);
    const keyBlur = Math.round(i * i * 1.3 + 2);
    const ambientA = (0.06 + i * 0.006).toFixed(3);
    const keyA = (0.08 + i * 0.012).toFixed(3);
    out.push({
      level: i,
      boxShadow:
        `0 ${ambientY}px ${ambientBlur}px rgba(${shadow}, ${ambientA}), ` +
        `0 ${keyY}px ${keyBlur}px rgba(${shadow}, ${keyA})`,
      overlay: `rgba(255, 255, 255, ${(i * 0.022).toFixed(3)})`,
    });
  }
  return out;
}

export function elevationToCss(levels: ElevationLevel[], name = "elevation"): string {
  return `:root {\n${levels
    .map((l) => `  --${name}-${l.level}: ${l.boxShadow};`)
    .join("\n")}\n}`;
}
