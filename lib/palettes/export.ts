import { ROLE_VARS, type Roles } from "./types";

function lines(roles: Roles, prefix: string): string {
  return (Object.keys(ROLE_VARS) as (keyof Roles)[])
    .map((key) => `  ${prefix}${ROLE_VARS[key].slice(2)}: ${roles[key]};`)
    .join("\n");
}

/** CSS custom properties (free export). */
export function toCssVars(roles: Roles): string {
  return `:root {\n${lines(roles, "--p-")}\n}`;
}

/** Tailwind v4 @theme block (free export). */
export function toTailwindTheme(roles: Roles): string {
  return `@theme {\n${lines(roles, "--color-p-")}\n}`;
}

export const FREE_FORMATS = ["CSS", "Tailwind"] as const;
export type FreeFormat = (typeof FREE_FORMATS)[number];

export function exportPalette(roles: Roles, format: FreeFormat): string {
  return format === "CSS" ? toCssVars(roles) : toTailwindTheme(roles);
}
