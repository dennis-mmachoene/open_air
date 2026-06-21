import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { publishPalette, deletePublished } from "@/lib/publish";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const ent = await getEntitlements(session.user.id);
  if (!ent.publish) {
    return NextResponse.json({ error: "Publishing is a Pro feature.", upgrade: true }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !Array.isArray(body.hexes)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  try {
    const row = await publishPalette(session.user.id, body);
    return NextResponse.json({ slug: row.slug, id: row.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "bad request" }, { status: 400 });
  await deletePublished(session.user.id, id);
  return NextResponse.json({ ok: true });
}
