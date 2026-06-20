import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { completeOnboarding } from "@/lib/onboarding";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const slugs: string[] = Array.isArray(body?.slugs)
    ? body.slugs.filter((s: unknown): s is string => typeof s === "string").slice(0, 6)
    : [];
  await completeOnboarding(session.user.id, slugs);
  return NextResponse.json({ ok: true });
}
