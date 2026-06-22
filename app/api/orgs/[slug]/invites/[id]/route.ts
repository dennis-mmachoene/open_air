import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrgBySlug, revokeInvite } from "@/lib/orgs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { slug, id } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    await revokeInvite(org.id, session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
