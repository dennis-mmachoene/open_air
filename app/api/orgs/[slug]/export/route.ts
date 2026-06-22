import { auth } from "@/lib/auth";
import { getOrgBySlug, getMembership } from "@/lib/orgs";
import { assembleOrgExport } from "@/lib/org-export";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("unauthenticated", { status: 401 });
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return new Response("not found", { status: 404 });
  if ((await getMembership(org.id, session.user.id)) !== "owner") return new Response("forbidden", { status: 403 });

  const data = await assembleOrgExport(org.id);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${slug}-export-${stamp}.json"` },
  });
}
