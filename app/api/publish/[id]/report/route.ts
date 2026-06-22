import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reportPalette } from "@/lib/social";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { reason?: unknown };
  const reason = typeof body.reason === "string" ? body.reason : "other";
  await reportPalette(session.user.id, id, reason);
  return NextResponse.json({ ok: true });
}
