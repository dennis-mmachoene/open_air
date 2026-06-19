import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "billing not configured" }, { status: 503 });
  }

  const db = getDb();
  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "no customer" }, { status: 400 });
  }

  const base = env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${base}/account`,
  });

  return NextResponse.json({ url: portal.url });
}
