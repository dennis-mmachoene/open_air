import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addComment, listComments } from "@/lib/social";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ comments: await listComments(id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { body?: unknown };
  if (typeof body.body !== "string") return NextResponse.json({ error: "body required" }, { status: 400 });
  try {
    return NextResponse.json({ comment: await addComment(session.user.id, id, body.body) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
