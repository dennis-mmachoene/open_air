"use client";

import { ExportPanel } from "@/components/palette/ExportPanel";
import { useEntitlements } from "@/components/entitlements/useEntitlements";
import type { Roles, Swatch } from "@/lib/palettes/types";

export function ExportGate({
  roles,
  swatches,
  name,
  slug,
}: {
  roles: Roles;
  swatches: Swatch[];
  name: string;
  slug: string;
}) {
  const { entitlements } = useEntitlements();
  return (
    <ExportPanel
      roles={roles}
      swatches={swatches}
      name={name}
      slug={slug}
      pro={entitlements?.allExports ?? false}
    />
  );
}
