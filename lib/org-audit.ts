import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { orgAuditLogs, users } from "./db/schema";

export interface OrgAuditEntry {
  orgId: string;
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

/** Append an org activity record. Best-effort: never breaks the caller. */
export async function writeOrgAudit(entry: OrgAuditEntry): Promise<void> {
  try {
    const db = getDb();
    let actorLabel: string | null = null;
    if (entry.actorId) {
      const [u] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, entry.actorId)).limit(1);
      actorLabel = u?.name ?? u?.email ?? null;
    }
    await db.insert(orgAuditLogs).values({
      orgId: entry.orgId,
      actorId: entry.actorId ?? null,
      actorLabel,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    console.error("[org-audit] write failed", entry.action, err);
  }
}

export interface OrgAuditRow {
  id: string;
  actorLabel: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export async function listOrgAudit(orgId: string, opts: { action?: string; limit?: number; offset?: number } = {}): Promise<OrgAuditRow[]> {
  const db = getDb();
  const limit = Math.min(opts.limit ?? 100, 1000);
  const where = opts.action
    ? and(eq(orgAuditLogs.orgId, orgId), eq(orgAuditLogs.action, opts.action))
    : eq(orgAuditLogs.orgId, orgId);
  const rows = await db
    .select({
      id: orgAuditLogs.id,
      actorLabel: orgAuditLogs.actorLabel,
      action: orgAuditLogs.action,
      targetType: orgAuditLogs.targetType,
      targetId: orgAuditLogs.targetId,
      metadata: orgAuditLogs.metadata,
      createdAt: orgAuditLogs.createdAt,
    })
    .from(orgAuditLogs)
    .where(where)
    .orderBy(desc(orgAuditLogs.createdAt))
    .limit(limit)
    .offset(opts.offset ?? 0);
  return rows as OrgAuditRow[];
}

export async function orgAuditActions(orgId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db.selectDistinct({ action: orgAuditLogs.action }).from(orgAuditLogs).where(eq(orgAuditLogs.orgId, orgId)).orderBy(orgAuditLogs.action);
  return rows.map((r) => r.action);
}

export async function countOrgAudit(orgId: string): Promise<number> {
  const db = getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(orgAuditLogs).where(eq(orgAuditLogs.orgId, orgId));
  return Number(n);
}

/** Full export (capped), newest first, for CSV/JSON download. */
export async function exportOrgAudit(orgId: string, limit = 10000): Promise<OrgAuditRow[]> {
  return listOrgAudit(orgId, { limit });
}

export function auditToCSV(rows: OrgAuditRow[]): string {
  const header = ["timestamp", "actor", "action", "target_type", "target_id", "metadata"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      r.actorLabel ?? "",
      r.action,
      r.targetType ?? "",
      r.targetId ?? "",
      JSON.stringify(r.metadata ?? {}),
    ].map((v) => esc(String(v))).join(","),
  );
  return [header.join(","), ...lines].join("\n") + "\n";
}
