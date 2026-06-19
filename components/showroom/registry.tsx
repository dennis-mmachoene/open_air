import type { ReactNode } from "react";
import { primitives } from "./specimens/primitives";
import { components } from "./specimens/components";
import { dataviz } from "./specimens/dataviz";
import { screens } from "./specimens/screens";

export type SpecimenGroup = "Primitives" | "Components" | "Data" | "Screens";

export interface Specimen {
  id: string;
  group: SpecimenGroup;
  title: string;
  /** Column span in the masonry grid (1–3). Screens usually span full width. */
  span?: 1 | 2 | 3;
  render: () => ReactNode;
}

export const GROUPS: SpecimenGroup[] = [
  "Primitives",
  "Components",
  "Data",
  "Screens",
];

/** The specimen catalog. Adding a specimen is a one-line registry addition. */
export const REGISTRY: Specimen[] = [
  ...primitives,
  ...components,
  ...dataviz,
  ...screens,
];
