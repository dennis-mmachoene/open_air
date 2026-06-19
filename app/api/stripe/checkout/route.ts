import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { priceId, stripe, type Interval } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "billing not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as
    | { plan?: unknown; interval?: unknown }
    | null;
  const plan = body?.plan === "studio" ? "studio" : body?.plan === "pro" ? "pro" : null;
  const interval: Interval = body?.interval === "yearly" ? "yearly" : "monthly";
  if (!plan) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const price = priceId(plan, interval);
  if (!price) {
    return NextResponse.json({ error: "price not configured" }, { status: 503 });
  }

  const db = getDb();
  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  let customerId = user?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? session.user.email ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, session.user.id));
  }

  const base = env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${base}/account?checkout=success`,
    cancel_url: `${base}/pricing?checkout=cancelled`,
    subscription_data: { metadata: { userId: session.user.id } },
  });

  return NextResponse.json({ url: checkout.url });
}
