import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { organizations, organizationMembers, organizationInvites, users } from "./db/schema";
import { normalizePlan, PLAN_FEATURES } from "./plans";
import { writeOrgAudit } from "./org-audit";

export const ORG_ROLES = ["owner", "admin", "member"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];
const ROLE_RANK: Record<OrgRole, number> = { owner: 3, admin: 2, member: 1 };

export function isOrgRole(r: string): r is OrgRole {
  return (ORG_ROLES as readonly string[]).includes(r);
}

const INVITE_TTL_DAYS = 14;

function slugify(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
  const suffix = randomBytes(3).toString("hex");
  return `${base || "team"}-${suffix}`;
}

export interface Org {
  id: string;
  slug: string;
  name: string;
  ownerId: string;
  plan: string;
  createdAt: Date;
}

/** Create an organization and seat the creator as its owner. */
export async function createOrg(userId: string, name: string): Promise<Org> {
  const clean = name.trim().slice(0, 60);
  if (clean.length < 2) throw new Error("Team name must be at least 2 characters.");
  const db = getDb();
  const [creator] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, userId)).limit(1);
  if (!PLAN_FEATURES[normalizePlan(creator?.plan)].teams) {
    throw new Error("Creating a team requires a Pro plan.");
  }
  const [org] = await db
    .insert(organizations)
    .values({ slug: slugify(clean), name: clean, ownerId: userId })
    .returning();
  await db
    .insert(organizationMembers)
    .values({ orgId: org.id, userId, role: "owner" })
    .onConflictDoNothing();
  return org as Org;
}

export async function getOrgBySlug(slug: string): Promise<Org | null> {
  const db = getDb();
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return (org as Org) ?? null;
}

export interface OrgWithRole extends Org {
  role: OrgRole;
  memberCount: number;
}

/** Every org the user belongs to, with their role and the team size. */
export async function listOrgsForUser(userId: string): Promise<OrgWithRole[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      name: organizations.name,
      ownerId: organizations.ownerId,
      plan: organizations.plan,
      createdAt: organizations.createdAt,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
    .where(eq(organizationMembers.userId, userId))
    .orderBy(desc(organizations.createdAt));

  const result: OrgWithRole[] = [];
  for (const r of rows) {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(organizationMembers)
      .where(eq(organizationMembers.orgId, r.id));
    result.push({ ...(r as Org), role: r.role as OrgRole, memberCount: Number(n) });
  }
  return result;
}

export async function getMembership(orgId: string, userId: string): Promise<OrgRole | null> {
  const db = getDb();
  const [row] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)))
    .limit(1);
  return row ? (row.role as OrgRole) : null;
}

/** The seat cap for a team, derived from its owner's plan. */
export async function ownerSeatLimit(orgId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ plan: users.plan })
    .from(organizations)
    .innerJoin(users, eq(users.id, organizations.ownerId))
    .where(eq(organizations.id, orgId))
    .limit(1);
  return PLAN_FEATURES[normalizePlan(row?.plan)].teamSeats;
}

/** Seats in use = current members + outstanding pending invites. */
export async function seatUsage(orgId: string): Promise<number> {
  const db = getDb();
  const [m] = await db.select({ n: sql<number>`count(*)` }).from(organizationMembers).where(eq(organizationMembers.orgId, orgId));
  const [i] = await db
    .select({ n: sql<number>`count(*)` })
    .from(organizationInvites)
    .where(and(eq(organizationInvites.orgId, orgId), eq(organizationInvites.status, "pending")));
  return Number(m.n) + Number(i.n);
}

/** Resolve membership and assert at least `min` privilege; throws otherwise. */
export async function requireRole(orgId: string, userId: string, min: OrgRole): Promise<OrgRole> {
  const role = await getMembership(orgId, userId);
  if (!role || ROLE_RANK[role] < ROLE_RANK[min]) throw new Error("Not allowed.");
  return role;
}

export interface Member {
  userId: string;
  role: OrgRole;
  name: string | null;
  email: string | null;
  image: string | null;
  handle: string | null;
  createdAt: Date;
}

export async function listMembers(orgId: string): Promise<Member[]> {
  const db = getDb();
  const rows = await db
    .select({
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      name: users.name,
      email: users.email,
      image: users.image,
      handle: users.handle,
      createdAt: organizationMembers.createdAt,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.orgId, orgId))
    .orderBy(desc(organizationMembers.createdAt));
  return rows as Member[];
}

async function countOwners(orgId: string): Promise<number> {
  const db = getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "owner")));
  return Number(n);
}

export interface Invite {
  id: string;
  orgId: string;
  email: string;
  role: OrgRole;
  token: string;
  status: string;
  expiresAt: Date;
}

/** Invite someone by email. Requires admin or owner. */
export async function inviteMember(
  orgId: string,
  actorId: string,
  email: string,
  role: OrgRole = "member",
): Promise<Invite> {
  await requireRole(orgId, actorId, "admin");
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) throw new Error("Enter a valid email address.");
  const r: OrgRole = role === "owner" ? "admin" : role; // can't invite straight to owner
  const db = getDb();

  // Already a member?
  const [existing] = await db
    .select({ userId: organizationMembers.userId })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(and(eq(organizationMembers.orgId, orgId), eq(users.email, clean)))
    .limit(1);
  if (existing) throw new Error("That person is already on the team.");

  const [limit, used] = await Promise.all([ownerSeatLimit(orgId), seatUsage(orgId)]);
  if (used >= limit) throw new Error(`Your team is at its seat limit (${limit}). Upgrade the plan or remove a member to invite more.`);

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400_000);
  const [row] = await db
    .insert(organizationInvites)
    .values({ orgId, email: clean, role: r, token, invitedBy: actorId, expiresAt })
    .returning();
  await writeOrgAudit({ orgId, actorId, action: "member.invited", targetType: "invite", targetId: row.id, metadata: { email: clean, role: r } });
  return row as Invite;
}

export async function listInvites(orgId: string): Promise<Invite[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(organizationInvites)
    .where(and(eq(organizationInvites.orgId, orgId), eq(organizationInvites.status, "pending")))
    .orderBy(desc(organizationInvites.createdAt));
  return rows as Invite[];
}

export async function getInviteByToken(token: string): Promise<(Invite & { orgName: string; orgSlug: string }) | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: organizationInvites.id,
      orgId: organizationInvites.orgId,
      email: organizationInvites.email,
      role: organizationInvites.role,
      token: organizationInvites.token,
      status: organizationInvites.status,
      expiresAt: organizationInvites.expiresAt,
      orgName: organizations.name,
      orgSlug: organizations.slug,
    })
    .from(organizationInvites)
    .innerJoin(organizations, eq(organizations.id, organizationInvites.orgId))
    .where(eq(organizationInvites.token, token))
    .limit(1);
  return (row as (Invite & { orgName: string; orgSlug: string })) ?? null;
}

/** Accept an invite. Seats the user and marks the invite accepted. */
export async function acceptInvite(token: string, userId: string): Promise<{ orgSlug: string }> {
  const db = getDb();
  const invite = await getInviteByToken(token);
  if (!invite) throw new Error("This invite link is invalid.");
  if (invite.status !== "pending") throw new Error("This invite has already been used.");
  if (invite.expiresAt.getTime() < Date.now()) throw new Error("This invite has expired.");

  await db
    .insert(organizationMembers)
    .values({ orgId: invite.orgId, userId, role: invite.role })
    .onConflictDoNothing();
  await db
    .update(organizationInvites)
    .set({ status: "accepted" })
    .where(eq(organizationInvites.id, invite.id));
  await writeOrgAudit({ orgId: invite.orgId, actorId: userId, action: "member.joined", targetType: "user", targetId: userId, metadata: { role: invite.role } });
  return { orgSlug: invite.orgSlug };
}

export async function revokeInvite(orgId: string, actorId: string, inviteId: string): Promise<void> {
  await requireRole(orgId, actorId, "admin");
  const db = getDb();
  await db
    .update(organizationInvites)
    .set({ status: "revoked" })
    .where(and(eq(organizationInvites.id, inviteId), eq(organizationInvites.orgId, orgId)));
}

/** Change a member's role. Owner-only. Cannot demote the last owner. */
export async function updateMemberRole(
  orgId: string,
  actorId: string,
  targetUserId: string,
  role: OrgRole,
): Promise<void> {
  await requireRole(orgId, actorId, "owner");
  if (!isOrgRole(role)) throw new Error("Invalid role.");
  const db = getDb();
  const current = await getMembership(orgId, targetUserId);
  if (!current) throw new Error("Not a member.");
  if (current === "owner" && role !== "owner" && (await countOwners(orgId)) <= 1) {
    throw new Error("A team must have at least one owner.");
  }
  await db
    .update(organizationMembers)
    .set({ role })
    .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, targetUserId)));
  await writeOrgAudit({ orgId, actorId, action: "member.role_changed", targetType: "user", targetId: targetUserId, metadata: { from: current, to: role } });
}

/** Remove a member. Owner/admin; admins can't remove owners; never the last owner. */
export async function removeMember(orgId: string, actorId: string, targetUserId: string): Promise<void> {
  const actorRole = await requireRole(orgId, actorId, "admin");
  const targetRole = await getMembership(orgId, targetUserId);
  if (!targetRole) return;
  if (targetRole === "owner") {
    if (actorRole !== "owner") throw new Error("Only an owner can remove an owner.");
    if ((await countOwners(orgId)) <= 1) throw new Error("A team must have at least one owner.");
  }
  const db = getDb();
  await db
    .delete(organizationMembers)
    .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, targetUserId)));
  await writeOrgAudit({ orgId, actorId, action: "member.removed", targetType: "user", targetId: targetUserId, metadata: { role: targetRole } });
}

export async function renameOrg(orgId: string, actorId: string, name: string): Promise<void> {
  await requireRole(orgId, actorId, "admin");
  const clean = name.trim().slice(0, 60);
  if (clean.length < 2) throw new Error("Team name must be at least 2 characters.");
  const db = getDb();
  await db.update(organizations).set({ name: clean, updatedAt: new Date() }).where(eq(organizations.id, orgId));
  await writeOrgAudit({ orgId, actorId, action: "org.renamed", targetType: "org", targetId: orgId, metadata: { name: clean } });
}


/** Email addresses of a team's owners + admins (proposal reviewers). */
export async function listReviewerEmails(orgId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ email: users.email, role: organizationMembers.role })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.orgId, orgId));
  return rows.filter((r) => r.role === "owner" || r.role === "admin").map((r) => r.email).filter(Boolean) as string[];
}

export async function memberDisplayName(userId: string): Promise<string> {
  const db = getDb();
  const [row] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.name ?? row?.email ?? "A teammate";
}

export async function memberEmail(userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.email ?? null;
}
