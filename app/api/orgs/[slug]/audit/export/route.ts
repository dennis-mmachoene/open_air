import { auth } from "@/lib/auth";
import { getOrgBySlug, getMembership } from "@/lib/orgs";
import { exportOrgAudit, auditToCSV } from "@/lib/org-audit";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("unauthenticated", { status: 401 });
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return new Response("not found", { status: 404 });
  const role = await getMembership(org.id, session.user.id);
  if (role !== "owner" && role !== "admin") return new Response("forbidden", { status: 403 });

  const format = new URL(request.url).searchParams.get("format") === "json" ? "json" : "csv";
  const rows = await exportOrgAudit(org.id);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${slug}-audit-${stamp}.${format}`;

  if (format === "json") {
    return new Response(JSON.stringify(rows, null, 2), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${filename}"` },
    });
  }
  return new Response(auditToCSV(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
