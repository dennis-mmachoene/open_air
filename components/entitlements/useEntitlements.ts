"use client";

import { useEffect, useState } from "react";
import type { Plan, PlanFeatures } from "@/lib/plans";

export type ClientEntitlements = PlanFeatures & { plan: Plan };

// Module-level singleton so multiple gates on one page share a single request.
let cache: Promise<ClientEntitlements | null> | null = null;

function load(): Promise<ClientEntitlements | null> {
  if (!cache) {
    cache = fetch("/api/me/entitlements")
      .then((r) => (r.ok ? r.json() : { entitlements: null }))
      .then((d) => (d?.entitlements ?? null) as ClientEntitlements | null)
      .catch(() => null);
  }
  return cache;
}

/** Resolve the viewer's entitlements on the client. Until loaded, callers get
 *  `null` (treat as free) — so a static page shows the free state first and
 *  upgrades in place for paid users after hydration. */
export function useEntitlements(): {
  loaded: boolean;
  entitlements: ClientEntitlements | null;
} {
  const [state, setState] = useState<{
    loaded: boolean;
    entitlements: ClientEntitlements | null;
  }>({ loaded: false, entitlements: null });

  useEffect(() => {
    let active = true;
    load().then((e) => {
      if (active) setState({ loaded: true, entitlements: e });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
