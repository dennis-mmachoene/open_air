import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";

/** Delete the account. Cancels any live Stripe subscription FIRST (so a deleted
 *  user is never billed again), then removes the user — FK cascades clear saves,
 *  collections, generated palettes, API keys, subscriptions, accounts, sessions. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const db = getDb();

  // Cancel live subscriptions in Stripe before we lose the local records.
  if (stripe) {
    const subs = await db
      .select({ id: subscriptions.stripeSubscriptionId, status: subscriptions.status })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.user.id),
          inArray(subscriptions.status, ["active", "trialing", "past_due", "unpaid"]),
        ),
      );
    for (const sub of subs) {
      try {
        await stripe.subscriptions.cancel(sub.id);
      } catch (err) {
        console.error("Failed to cancel subscription on account delete", sub.id, err);
      }
    }
  }

  await db.delete(users).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true });
}
