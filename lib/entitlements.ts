import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "./db/schema";
import { normalizePlan, PLAN_FEATURES, type Plan, type PlanFeatures } from "./plans";

export interface Entitlements extends PlanFeatures {
  plan: Plan;
}

/**
 * Server-side entitlements. users.plan is kept authoritative by the Stripe
 * webhook (derived from the subscription's price). Never trust the client.
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  const db = getDb();
  const [row] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const plan = normalizePlan(row?.plan);
  return { plan, ...PLAN_FEATURES[plan] };
}

export interface UpgradeRequired {
  upgradeRequired: true;
  feature: string;
  requiredPlan: Plan;
}

export function upgradeRequired(feature: string, requiredPlan: Plan = "pro"): UpgradeRequired {
  return { upgradeRequired: true, feature, requiredPlan };
}
