import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleFollow } from "@/lib/social";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await params;
  try {
    return NextResponse.json(await toggleFollow(session.user.id, id));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
