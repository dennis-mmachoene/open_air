import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleBookmark } from "@/lib/social";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await params;
  return NextResponse.json(await toggleBookmark(session.user.id, id));
}
