import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { orgDomains, organizationMembers, organizations } from "./db/schema";
import { requireRole } from "./orgs";
import { writeOrgAudit } from "./org-audit";

const DOMAIN_RE = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;
// Public/free email providers can't be claimed for auto-join.
const PUBLIC_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com",
  "live.com", "icloud.com", "me.com", "proton.me", "protonmail.com", "aol.com",
  "gmx.com", "mail.com", "yandex.com", "zoho.com",
]);

export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^@/, "").replace(/^https?:\/\//, "").split("/")[0];
}

export function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).trim().toLowerCase();
}

export function isClaimableDomain(domain: string): boolean {
  return DOMAIN_RE.test(domain) && !PUBLIC_DOMAINS.has(domain);
}

export interface OrgDomain {
  id: string;
  orgId: string;
  domain: string;
  verified: boolean;
  verificationToken: string;
  autoJoin: boolean;
  createdAt: Date;
}

async function domainOrg(domainId: string): Promise<{ orgId: string }> {
  const db = getDb();
  const [d] = await db.select({ orgId: orgDomains.orgId }).from(orgDomains).where(eq(orgDomains.id, domainId)).limit(1);
  if (!d) throw new Error("Domain not found.");
  return d;
}

/** Claim a domain for a team (admin/owner). Returns the TXT verification token. */
export async function addDomain(orgId: string, actorId: string, domainInput: string): Promise<OrgDomain> {
  await requireRole(orgId, actorId, "admin");
  const domain = normalizeDomain(domainInput);
  if (!isClaimableDomain(domain)) throw new Error("Enter a valid company domain (public email providers can't be claimed).");
  const db = getDb();
  const [existing] = await db.select({ id: orgDomains.id }).from(orgDomains).where(eq(orgDomains.domain, domain)).limit(1);
  if (existing) throw new Error("That domain is already claimed.");
  const token = `open-air-verify=${randomBytes(16).toString("hex")}`;
  const [row] = await db.insert(orgDomains).values({ orgId, domain, verificationToken: token }).returning();
  await writeOrgAudit({ orgId, actorId, action: "domain.added", targetType: "domain", targetId: row.id, metadata: { domain } });
  return row as OrgDomain;
}

export async function listDomains(orgId: string): Promise<OrgDomain[]> {
  const db = getDb();
  const rows = await db.select().from(orgDomains).where(eq(orgDomains.orgId, orgId)).orderBy(desc(orgDomains.createdAt));
  return rows as OrgDomain[];
}

/**
 * Mark a domain verified. In production this is gated by a DNS TXT lookup for
 * `verificationToken`; the caller performs that check before flipping the flag.
 */
export async function verifyDomain(domainId: string, actorId: string): Promise<void> {
  const { orgId } = await domainOrg(domainId);
  await requireRole(orgId, actorId, "admin");
  const db = getDb();
  await db.update(orgDomains).set({ verified: true }).where(eq(orgDomains.id, domainId));
  const [d] = await db.select({ domain: orgDomains.domain }).from(orgDomains).where(eq(orgDomains.id, domainId)).limit(1);
  await writeOrgAudit({ orgId, actorId, action: "domain.verified", targetType: "domain", targetId: domainId, metadata: { domain: d?.domain } });
}

export async function setDomainAutoJoin(domainId: string, actorId: string, autoJoin: boolean): Promise<void> {
  const { orgId } = await domainOrg(domainId);
  await requireRole(orgId, actorId, "admin");
  const db = getDb();
  await db.update(orgDomains).set({ autoJoin }).where(eq(orgDomains.id, domainId));
}

export async function removeDomain(domainId: string, actorId: string): Promise<void> {
  const { orgId } = await domainOrg(domainId);
  await requireRole(orgId, actorId, "admin");
  const db = getDb();
  const [d] = await db.select({ domain: orgDomains.domain }).from(orgDomains).where(eq(orgDomains.id, domainId)).limit(1);
  await db.delete(orgDomains).where(eq(orgDomains.id, domainId));
  await writeOrgAudit({ orgId, actorId, action: "domain.removed", targetType: "domain", targetId: domainId, metadata: { domain: d?.domain } });
}

/**
 * Just-in-time provisioning: seat a user into every team that has verified
 * their email's domain with auto-join enabled. Idempotent. Returns org slugs joined.
 */
export async function provisionMembershipsForEmail(userId: string, email: string | null | undefined): Promise<string[]> {
  if (!email) return [];
  const domain = emailDomain(email);
  if (!domain || PUBLIC_DOMAINS.has(domain)) return [];
  const db = getDb();
  const matches = await db
    .select({ orgId: orgDomains.orgId, slug: organizations.slug })
    .from(orgDomains)
    .innerJoin(organizations, eq(organizations.id, orgDomains.orgId))
    .where(and(eq(orgDomains.domain, domain), eq(orgDomains.verified, true), eq(orgDomains.autoJoin, true)));

  const joined: string[] = [];
  for (const m of matches) {
    const [already] = await db
      .select({ a: organizationMembers.userId })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, m.orgId), eq(organizationMembers.userId, userId)))
      .limit(1);
    if (already) continue;
    await db.insert(organizationMembers).values({ orgId: m.orgId, userId, role: "member" }).onConflictDoNothing();
    await writeOrgAudit({ orgId: m.orgId, actorId: userId, action: "member.joined", targetType: "user", targetId: userId, metadata: { via: "domain", domain } });
    joined.push(m.slug);
  }
  return joined;
}
