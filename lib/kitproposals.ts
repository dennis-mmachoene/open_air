import { and, desc, eq, sql, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { brandKits, brandKitAssets, brandKitProposals } from "./db/schema";
import { requireRole } from "./orgs";
import { addAsset, updateAsset, deleteAsset } from "./brandkits";
import { writeOrgAudit } from "./org-audit";

export type ProposalType = "add_asset" | "update_asset" | "delete_asset";
const TYPES = new Set<ProposalType>(["add_asset", "update_asset", "delete_asset"]);
const HEX_RE = /^#[0-9a-f]{6}$/i;

export interface Proposal {
  id: string;
  kitId: string;
  proposedBy: string;
  type: ProposalType;
  targetAssetId: string | null;
  payload: { name?: string; hexes?: string[]; notes?: string };
  note: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

async function kitOrg(kitId: string): Promise<string> {
  const db = getDb();
  const [k] = await db.select({ orgId: brandKits.orgId }).from(brandKits).where(eq(brandKits.id, kitId)).limit(1);
  if (!k) throw new Error("Kit not found.");
  return k.orgId;
}

export interface ProposeInput {
  type: ProposalType;
  targetAssetId?: string;
  name?: string;
  hexes?: string[];
  notes?: string;
  note?: string; // rationale
}

/** Any member may propose a change. Validated but not applied. */
export async function proposeChange(kitId: string, userId: string, input: ProposeInput): Promise<Proposal> {
  const orgId = await kitOrg(kitId);
  await requireRole(orgId, userId, "member");
  if (!TYPES.has(input.type)) throw new Error("Unknown proposal type.");
  const db = getDb();

  const payload: { name?: string; hexes?: string[]; notes?: string } = {};
  if (input.type === "add_asset" || input.type === "update_asset") {
    if (input.name !== undefined) payload.name = input.name.trim().slice(0, 60);
    if (input.hexes !== undefined) {
      const hexes = input.hexes.filter((h) => HEX_RE.test(h)).slice(0, 24);
      if (input.type === "add_asset" && hexes.length < 1) throw new Error("Add at least one valid hex color.");
      if (hexes.length) payload.hexes = hexes;
    }
    if (input.notes !== undefined) payload.notes = input.notes.slice(0, 200);
    if (input.type === "add_asset" && !payload.name) throw new Error("Give the new asset a name.");
  }

  let targetAssetId: string | null = null;
  if (input.type === "update_asset" || input.type === "delete_asset") {
    if (!input.targetAssetId) throw new Error("No target asset.");
    const [asset] = await db.select({ id: brandKitAssets.id, kitId: brandKitAssets.kitId }).from(brandKitAssets).where(eq(brandKitAssets.id, input.targetAssetId)).limit(1);
    if (!asset || asset.kitId !== kitId) throw new Error("That asset isn't in this kit.");
    targetAssetId = asset.id;
  }

  const [row] = await db
    .insert(brandKitProposals)
    .values({ kitId, proposedBy: userId, type: input.type, targetAssetId, payload, note: input.note?.slice(0, 280) || null })
    .returning();
  await writeOrgAudit({ orgId, actorId: userId, action: "proposal.created", targetType: "kit", targetId: kitId, metadata: { type: input.type } });
  return row as Proposal;
}

export async function listProposals(kitId: string, status?: "pending" | "approved" | "rejected"): Promise<Proposal[]> {
  const db = getDb();
  const where = status ? and(eq(brandKitProposals.kitId, kitId), eq(brandKitProposals.status, status)) : eq(brandKitProposals.kitId, kitId);
  const rows = await db.select().from(brandKitProposals).where(where).orderBy(desc(brandKitProposals.createdAt));
  return rows as Proposal[];
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const db = getDb();
  const [row] = await db.select().from(brandKitProposals).where(eq(brandKitProposals.id, id)).limit(1);
  return (row as Proposal) ?? null;
}

/** Count pending proposals across a set of kits (for badges). */
export async function pendingCountByKit(kitIds: string[]): Promise<Record<string, number>> {
  if (kitIds.length === 0) return {};
  const db = getDb();
  const rows = await db
    .select({ kitId: brandKitProposals.kitId, n: sql<number>`count(*)` })
    .from(brandKitProposals)
    .where(and(inArray(brandKitProposals.kitId, kitIds), eq(brandKitProposals.status, "pending")))
    .groupBy(brandKitProposals.kitId);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.kitId] = Number(r.n);
  return out;
}

/** Approve a pending proposal and apply its change. Requires admin/owner. */
export async function approveProposal(proposalId: string, actorId: string): Promise<void> {
  const db = getDb();
  const proposal = await getProposal(proposalId);
  if (!proposal) throw new Error("Proposal not found.");
  if (proposal.status !== "pending") throw new Error("This proposal was already reviewed.");
  const orgId = await kitOrg(proposal.kitId);
  await requireRole(orgId, actorId, "admin");

  if (proposal.type === "add_asset") {
    await addAsset(proposal.kitId, actorId, { name: proposal.payload.name ?? "Untitled", hexes: proposal.payload.hexes ?? [], notes: proposal.payload.notes });
  } else if (proposal.type === "update_asset") {
    if (!proposal.targetAssetId) throw new Error("Target asset missing.");
    await updateAsset(proposal.targetAssetId, actorId, { name: proposal.payload.name, hexes: proposal.payload.hexes, notes: proposal.payload.notes });
  } else if (proposal.type === "delete_asset") {
    if (proposal.targetAssetId) await deleteAsset(proposal.targetAssetId, actorId);
  }

  await db
    .update(brandKitProposals)
    .set({ status: "approved", reviewedBy: actorId, reviewedAt: new Date() })
    .where(eq(brandKitProposals.id, proposalId));
  await writeOrgAudit({ orgId, actorId, action: "proposal.approved", targetType: "kit", targetId: proposal.kitId, metadata: { type: proposal.type } });
}

/** Reject a pending proposal with an optional note. Requires admin/owner. */
export async function rejectProposal(proposalId: string, actorId: string, note?: string): Promise<void> {
  const proposal = await getProposal(proposalId);
  if (!proposal) throw new Error("Proposal not found.");
  if (proposal.status !== "pending") throw new Error("This proposal was already reviewed.");
  const orgId = await kitOrg(proposal.kitId);
  await requireRole(orgId, actorId, "admin");
  const db = getDb();
  await db
    .update(brandKitProposals)
    .set({ status: "rejected", reviewedBy: actorId, reviewNote: note?.slice(0, 280) || null, reviewedAt: new Date() })
    .where(eq(brandKitProposals.id, proposalId));
  await writeOrgAudit({ orgId, actorId, action: "proposal.rejected", targetType: "kit", targetId: proposal.kitId, metadata: { type: proposal.type } });
}
