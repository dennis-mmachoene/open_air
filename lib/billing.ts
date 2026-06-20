import type { Plan } from "./plans";

/** Stripe subscription statuses we treat as entitling the paid plan. */
export const ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "trialing",
  "past_due",
]);

/**
 * The plan a user should hold given their subscription's status and the plan
 * its price maps to. Anything not active falls back to free. Pure — this is the
 * money-path decision, isolated so it can be unit-tested without Stripe or a DB.
 */
export function effectivePlan(status: string, planForPrice: Plan): Plan {
  return ACTIVE_STATUSES.has(status) ? planForPrice : "free";
}
