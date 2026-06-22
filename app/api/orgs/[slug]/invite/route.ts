import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrgBySlug, inviteMember, isOrgRole, type OrgRole } from "@/lib/orgs";
import { sendEmail, orgInviteEmail } from "@/lib/email";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; role?: unknown };
  if (typeof body.email !== "string") return NextResponse.json({ error: "email required" }, { status: 400 });
  const role: OrgRole = typeof body.role === "string" && isOrgRole(body.role) ? body.role : "member";
  try {
    const invite = await inviteMember(org.id, session.user.id, body.email, role);
    await sendEmail(orgInviteEmail(invite.email, { orgName: org.name, inviterName: session.user.name, token: invite.token }));
    return NextResponse.json({ invite: { id: invite.id, email: invite.email, role: invite.role } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
