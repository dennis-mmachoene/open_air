import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrgBySlug, updateMemberRole, removeMember, isOrgRole, type OrgRole } from "@/lib/orgs";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { slug, userId } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { role?: unknown };
  if (typeof body.role !== "string" || !isOrgRole(body.role)) return NextResponse.json({ error: "invalid role" }, { status: 400 });
  try {
    await updateMemberRole(org.id, session.user.id, userId, body.role as OrgRole);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { slug, userId } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    await removeMember(org.id, session.user.id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
