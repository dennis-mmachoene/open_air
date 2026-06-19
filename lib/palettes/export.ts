import { ROLE_VARS, type Roles, type Swatch } from "./types";

type Entry = [name: string, hex: string];

/** Role token names without the leading `--` (e.g. "p-bg", "p-on-primary"). */
function entries(roles: Roles): Entry[] {
  return (Object.keys(ROLE_VARS) as (keyof Roles)[]).map((k) => [
    ROLE_VARS[k].slice(2),
    roles[k],
  ]);
}

// --- Text formats -----------------------------------------------------------

export function toCssVars(roles: Roles): string {
  return `:root {\n${entries(roles)
    .map(([n, h]) => `  --${n}: ${h};`)
    .join("\n")}\n}`;
}

export function toTailwindTheme(roles: Roles): string {
  return `@theme {\n${entries(roles)
    .map(([n, h]) => `  --color-${n}: ${h};`)
    .join("\n")}\n}`;
}

export function toScss(roles: Roles): string {
  return entries(roles)
    .map(([n, h]) => `$${n}: ${h};`)
    .join("\n");
}

export function toJsonTokens(roles: Roles): string {
  const obj: Record<string, { value: string; type: "color" }> = {};
  for (const [n, h] of entries(roles)) obj[n] = { value: h, type: "color" };
  return JSON.stringify(obj, null, 2);
}

/** Tokens Studio (Figma) shape. */
export function toFigmaTokens(roles: Roles, name = "Open Air"): string {
  const colors: Record<string, { value: string; type: "color" }> = {};
  for (const [n, h] of entries(roles)) {
    colors[n.replace(/^p-/, "")] = { value: h, type: "color" };
  }
  return JSON.stringify({ [name]: colors }, null, 2);
}

export function toSvgSheet(swatches: Swatch[], name = "Open Air"): string {
  const cw = 140;
  const ch = 160;
  const width = cw * swatches.length;
  const cells = swatches
    .map(
      (s, i) =>
        `<g transform="translate(${i * cw},0)">` +
        `<rect width="${cw}" height="120" fill="${s.hex}"/>` +
        `<text x="14" y="146" font-family="monospace" font-size="15" fill="#1c1c1a">${s.hex}</text>` +
        `</g>`,
    )
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${ch}" ` +
    `viewBox="0 0 ${width} ${ch}" role="img" aria-label="${name} swatches">${cells}</svg>`
  );
}

// --- Binary: ASE (Adobe Swatch Exchange) ------------------------------------

function hexToRgbFloat(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return [r, g, b];
}

export function toAse(swatches: Swatch[]): Uint8Array {
  const out: number[] = [];
  const u16 = (v: number) => out.push((v >> 8) & 0xff, v & 0xff);
  const u32 = (v: number) =>
    out.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
  const f32 = (v: number) => {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setFloat32(0, v, false);
    out.push(...new Uint8Array(buf));
  };

  // Header: "ASEF", version 1.0, block count
  out.push(0x41, 0x53, 0x45, 0x46); // ASEF
  u16(1);
  u16(0);
  u32(swatches.length);

  for (const s of swatches) {
    const name = s.name;
    const nameLen = name.length + 1; // include null terminator (UTF-16 units)
    // block body: nameLen(2) + name(2*nameLen) + "RGB "(4) + 3*f32(12) + colorType(2)
    const bodyLen = 2 + nameLen * 2 + 4 + 12 + 2;
    u16(0x0001); // color entry
    u32(bodyLen);
    u16(nameLen);
    for (const ch of name) u16(ch.charCodeAt(0));
    u16(0); // null terminator
    out.push(0x52, 0x47, 0x42, 0x20); // "RGB "
    const [r, g, b] = hexToRgbFloat(s.hex);
    f32(r);
    f32(g);
    f32(b);
    u16(0x0002); // normal colour
  }

  return new Uint8Array(out);
}

// --- Format registry --------------------------------------------------------

export const TEXT_FORMATS = ["CSS", "Tailwind", "SCSS", "JSON", "Figma", "SVG"] as const;
export type TextFormat = (typeof TEXT_FORMATS)[number];
export const FREE_FORMATS: TextFormat[] = ["CSS", "Tailwind"];

export function exportText(
  format: TextFormat,
  roles: Roles,
  swatches: Swatch[],
  name: string,
): string {
  switch (format) {
    case "CSS":
      return toCssVars(roles);
    case "Tailwind":
      return toTailwindTheme(roles);
    case "SCSS":
      return toScss(roles);
    case "JSON":
      return toJsonTokens(roles);
    case "Figma":
      return toFigmaTokens(roles, name);
    case "SVG":
      return toSvgSheet(swatches, name);
  }
}

export const FILE_EXT: Record<TextFormat, string> = {
  CSS: "css",
  Tailwind: "css",
  SCSS: "scss",
  JSON: "json",
  Figma: "json",
  SVG: "svg",
};
