import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

/** The current user's entitlements (or null when logged out). Lets statically
 *  rendered pages resolve Pro gating on the client without going dynamic. */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ entitlements: null });
  const entitlements = await getEntitlements(session.user.id);
  return NextResponse.json({ entitlements });
}
