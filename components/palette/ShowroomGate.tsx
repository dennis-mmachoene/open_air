"use client";

import { Showroom } from "@/components/showroom/Showroom";
import { useEntitlements } from "@/components/entitlements/useEntitlements";
import type { Palette } from "@/lib/palettes/types";

export function ShowroomGate({
  palettes,
  lockedSlug,
}: {
  palettes: { slug: string; name: string; roles: Palette["roles"] }[];
  lockedSlug: string;
}) {
  const { entitlements } = useEntitlements();
  return (
    <Showroom
      palettes={palettes}
      lockedSlug={lockedSlug}
      preview={!entitlements?.fullShowroom}
    />
  );
}
