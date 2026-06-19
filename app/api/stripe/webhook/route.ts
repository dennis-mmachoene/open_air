import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getDb } from "@/lib/db";
import { subscriptions, users, webhookEvents } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { planForPrice, stripe } from "@/lib/stripe";

const ACTIVE = new Set(["active", "trialing", "past_due"]);

/** Mirror a Stripe subscription into our DB and update the user's plan. */
async function syncSubscription(sub: Stripe.Subscription) {
  const db = getDb();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  let userId = sub.metadata?.userId;
  if (!userId) {
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);
    userId = u?.id;
  }
  if (!userId) return;

  const item = sub.items.data[0];
  const price = item?.price?.id ?? null;
  const plan = planForPrice(price);
  const periodEnd = item ? new Date(item.current_period_end * 1000) : null;

  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeSubscriptionId: sub.id,
      status: sub.status,
      priceId: price,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        status: sub.status,
        priceId: price,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });

  const effectivePlan = ACTIVE.has(sub.status) ? plan : "free";
  await db.update(users).set({ plan: effectivePlan }).where(eq(users.id, userId));
}

export async function POST(request: Request) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "billing not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new NextResponse("invalid signature", { status: 400 });
  }

  // Idempotency — process each event id once.
  const db = getDb();
  const inserted = await db
    .insert(webhookEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });
  if (inserted.length === 0) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.subscription) {
        const id = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
        const sub = await stripe.subscriptions.retrieve(id);
        await syncSubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
