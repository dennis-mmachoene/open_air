import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSavedSlugs } from "@/lib/saves";
import { listUserCollections } from "@/lib/user-collections";
import { listUserPalettes } from "@/lib/user-palettes";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const db = getDb();
  const [user] = await db
    .select({ email: users.email, name: users.name, plan: users.plan, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const [saved, collections, generated] = await Promise.all([
    getSavedSlugs(session.user.id),
    listUserCollections(session.user.id),
    listUserPalettes(session.user.id),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    savedPalettes: saved,
    collections,
    generatedPalettes: generated,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="open-air-data.json"',
    },
  });
}
