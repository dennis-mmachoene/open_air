import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Delete the account. FK cascades remove saves, collections, generated
 *  palettes, API keys, subscriptions, accounts and sessions. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const db = getDb();
  await db.delete(users).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true });
}
