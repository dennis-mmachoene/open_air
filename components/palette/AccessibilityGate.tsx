"use client";

import { AccessibilityCenter } from "@/components/palette/AccessibilityCenter";
import { AccessibilityReport } from "@/components/palette/AccessibilityReport";
import { useEntitlements } from "@/components/entitlements/useEntitlements";
import type { Roles, Swatch } from "@/lib/palettes/types";
import type { Pairing } from "@/lib/color/contrast";

export function AccessibilityGate({
  rolesLight,
  swatches,
  pairings,
}: {
  rolesLight: Roles;
  swatches: Swatch[];
  pairings: Pairing[];
}) {
  const { entitlements } = useEntitlements();
  if (entitlements?.accessibilityCenter) {
    return <AccessibilityCenter roles={rolesLight} swatches={swatches} />;
  }
  return (
    <>
      <AccessibilityReport pairings={pairings} />
      <p className="text-sm text-text-muted">
        The full accessibility center — every pairing, large vs normal text, and
        colour-blind simulation — comes with Pro.
      </p>
    </>
  );
}
