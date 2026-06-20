import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getDb } from "@/lib/db";
import { subscriptions, users, webhookEvents } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { planForPrice, stripe } from "@/lib/stripe";
import { paymentFailedEmail, receiptEmail, sendEmail } from "@/lib/email";

const ACTIVE = new Set(["active", "trialing", "past_due"]);

async function userForCustomer(customerId: string) {
  const db = getDb();
  const [u] = await db
    .select({ email: users.email, name: users.name, plan: users.plan })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  return u ?? null;
}

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

  // Idempotency — skip events we've already processed.
  const db = getDb();
  const [seen] = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.id, event.id))
    .limit(1);
  if (seen) {
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
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId && invoice.amount_paid > 0) {
        const u = await userForCustomer(customerId);
        if (u?.email) {
          await sendEmail(
            receiptEmail(u.email, {
              amount: invoice.amount_paid,
              currency: invoice.currency,
              plan: u.plan === "studio" ? "Studio" : "Pro",
              invoiceUrl: invoice.hosted_invoice_url,
              pdfUrl: invoice.invoice_pdf,
            }),
          );
        }
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        const u = await userForCustomer(customerId);
        if (u?.email) {
          await sendEmail(paymentFailedEmail(u.email, u.plan === "studio" ? "Studio" : "Pro"));
        }
      }
      break;
    }
    default:
      break;
  }

  // Mark processed only after success, so transient failures get retried.
  await db
    .insert(webhookEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing();

  return NextResponse.json({ received: true });
}
