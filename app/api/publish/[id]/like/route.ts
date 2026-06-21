import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleLike } from "@/lib/publish";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await params;
  const result = await toggleLike(session.user.id, id);
  return NextResponse.json(result);
}
