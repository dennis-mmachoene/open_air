import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  organizations, organizationMembers, organizationInvites, users,
  brandKits, brandKitAssets, brandKitProposals, orgDomains, orgAuditLogs,
} from "./db/schema";

export interface OrgExport {
  meta: { generatedAt: string; format: "open-air.org-export/v1" };
  organization: { id: string; slug: string; name: string; plan: string; createdAt: Date };
  members: { email: string | null; name: string | null; role: string; joinedAt: Date }[];
  pendingInvites: { email: string; role: string; createdAt: Date; expiresAt: Date }[];
  domains: { domain: string; verified: boolean; autoJoin: boolean; createdAt: Date }[];
  brandKits: {
    name: string; slug: string; description: string | null; createdAt: Date;
    assets: { name: string; type: string; hexes: string[]; notes: string | null }[];
  }[];
  proposals: { kit: string; type: string; status: string; note: string | null; createdAt: Date }[];
  auditLog: { actor: string | null; action: string; targetType: string | null; metadata: unknown; createdAt: Date }[];
}

/** Assemble a complete, portable export of everything a team owns. */
export async function assembleOrgExport(orgId: string): Promise<OrgExport | null> {
  const db = getDb();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org) return null;

  const members = await db
    .select({ email: users.email, name: users.name, role: organizationMembers.role, joinedAt: organizationMembers.createdAt })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.orgId, orgId))
    .orderBy(desc(organizationMembers.createdAt));

  const invites = await db
    .select({ email: organizationInvites.email, role: organizationInvites.role, createdAt: organizationInvites.createdAt, expiresAt: organizationInvites.expiresAt, status: organizationInvites.status })
    .from(organizationInvites)
    .where(eq(organizationInvites.orgId, orgId));

  const domains = await db
    .select({ domain: orgDomains.domain, verified: orgDomains.verified, autoJoin: orgDomains.autoJoin, createdAt: orgDomains.createdAt })
    .from(orgDomains)
    .where(eq(orgDomains.orgId, orgId));

  const kits = await db.select().from(brandKits).where(eq(brandKits.orgId, orgId));
  const kitIds = kits.map((k) => k.id);
  const assets = kitIds.length
    ? await db.select().from(brandKitAssets).where(inArray(brandKitAssets.kitId, kitIds))
    : [];
  const proposals = kitIds.length
    ? await db.select().from(brandKitProposals).where(inArray(brandKitProposals.kitId, kitIds))
    : [];
  const kitName = new Map(kits.map((k) => [k.id, k.name]));

  const audit = await db
    .select({ actor: orgAuditLogs.actorLabel, action: orgAuditLogs.action, targetType: orgAuditLogs.targetType, metadata: orgAuditLogs.metadata, createdAt: orgAuditLogs.createdAt })
    .from(orgAuditLogs)
    .where(eq(orgAuditLogs.orgId, orgId))
    .orderBy(desc(orgAuditLogs.createdAt))
    .limit(10000);

  return {
    meta: { generatedAt: new Date().toISOString(), format: "open-air.org-export/v1" },
    organization: { id: org.id, slug: org.slug, name: org.name, plan: org.plan, createdAt: org.createdAt },
    members: members.map((m) => ({ email: m.email, name: m.name, role: m.role, joinedAt: m.joinedAt })),
    pendingInvites: invites.filter((i) => i.status === "pending").map((i) => ({ email: i.email, role: i.role, createdAt: i.createdAt, expiresAt: i.expiresAt })),
    domains: domains.map((d) => ({ domain: d.domain, verified: d.verified, autoJoin: d.autoJoin, createdAt: d.createdAt })),
    brandKits: kits.map((k) => ({
      name: k.name, slug: k.slug, description: k.description, createdAt: k.createdAt,
      assets: assets.filter((a) => a.kitId === k.id).map((a) => ({ name: a.name, type: a.type, hexes: a.hexes, notes: a.notes })),
    })),
    proposals: proposals.map((p) => ({ kit: kitName.get(p.kitId) ?? "—", type: p.type, status: p.status, note: p.note, createdAt: p.createdAt })),
    auditLog: audit,
  };
}
