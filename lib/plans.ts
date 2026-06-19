export type Plan = "free" | "pro" | "studio";

export interface PlanFeatures {
  /** Max saved palettes; null = unlimited. */
  savedLimit: number | null;
  collections: boolean;
  fullShowroom: boolean;
  allExports: boolean;
  generator: boolean;
  gradientStudio: boolean;
  accessibilityCenter: boolean;
  teams: boolean;
  api: boolean;
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    savedLimit: 5,
    collections: false,
    fullShowroom: false,
    allExports: false,
    generator: false,
    gradientStudio: false,
    accessibilityCenter: false,
    teams: false,
    api: false,
  },
  pro: {
    savedLimit: null,
    collections: true,
    fullShowroom: true,
    allExports: true,
    generator: true,
    gradientStudio: true,
    accessibilityCenter: true,
    teams: false,
    api: false,
  },
  studio: {
    savedLimit: null,
    collections: true,
    fullShowroom: true,
    allExports: true,
    generator: true,
    gradientStudio: true,
    accessibilityCenter: true,
    teams: true,
    api: true,
  },
};

export const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, studio: 2 };

export function isPlan(value: string | null | undefined): value is Plan {
  return value === "free" || value === "pro" || value === "studio";
}

export function normalizePlan(value: string | null | undefined): Plan {
  return isPlan(value) ? value : "free";
}
