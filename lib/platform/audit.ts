import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { auditLogs } from "../db/schema";

export interface AuditEntry {
  actorAdminId?: string | null;
  actorLabel?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/** Append an immutable audit record. Never throws into the caller's flow. */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      actorAdminId: entry.actorAdminId ?? null,
      actorLabel: entry.actorLabel ?? null,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
      ip: entry.ip ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write", entry.action, err);
  }
}

export interface AuditRow {
  id: string;
  actorLabel: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: Date;
}

export async function listAudit(opts: { action?: string; limit?: number; offset?: number } = {}): Promise<AuditRow[]> {
  const db = getDb();
  const limit = Math.min(opts.limit ?? 100, 500);
  const where = opts.action ? eq(auditLogs.action, opts.action) : undefined;
  const rows = await db
    .select({
      id: auditLogs.id,
      actorLabel: auditLogs.actorLabel,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      metadata: auditLogs.metadata,
      ip: auditLogs.ip,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(where ?? sql`true`)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(opts.offset ?? 0);
  return rows as AuditRow[];
}

/** Distinct action names present, for the filter dropdown. */
export async function auditActions(): Promise<string[]> {
  const db = getDb();
  const rows = await db.selectDistinct({ action: auditLogs.action }).from(auditLogs).orderBy(auditLogs.action);
  return rows.map((r) => r.action);
}

