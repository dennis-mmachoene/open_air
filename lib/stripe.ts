import Stripe from "stripe";
import { env } from "./env";
import type { Plan } from "./plans";

/** Stripe client — null when no secret key is configured. */
export const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export const billingEnabled = Boolean(env.STRIPE_SECRET_KEY);

export type Interval = "monthly" | "yearly";
export type PaidPlan = Exclude<Plan, "free">;

/** Resolve the configured Stripe price id for a paid plan + interval. */
export function priceId(plan: PaidPlan, interval: Interval): string | undefined {
  const map: Record<PaidPlan, Record<Interval, string | undefined>> = {
    pro: {
      monthly: env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: env.STRIPE_PRICE_PRO_YEARLY,
    },
    studio: {
      monthly: env.STRIPE_PRICE_STUDIO_MONTHLY,
      yearly: env.STRIPE_PRICE_STUDIO_YEARLY,
    },
  };
  return map[plan][interval];
}

/** Map a Stripe price id back to a plan (used by the webhook). */
export function planForPrice(id: string | null | undefined): Plan {
  if (!id) return "free";
  if (id === env.STRIPE_PRICE_PRO_MONTHLY || id === env.STRIPE_PRICE_PRO_YEARLY) {
    return "pro";
  }
  if (id === env.STRIPE_PRICE_STUDIO_MONTHLY || id === env.STRIPE_PRICE_STUDIO_YEARLY) {
    return "studio";
  }
  return "free";
}
