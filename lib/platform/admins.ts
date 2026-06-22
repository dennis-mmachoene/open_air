import { desc, eq, sql, and, ne } from "drizzle-orm";
import { getDb } from "../db";
import { platformAdmins } from "../db/schema";
import { hashPassword, passwordIssue } from "./password";

export interface AdminRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

const COLS = {
  id: platformAdmins.id,
  email: platformAdmins.email,
  name: platformAdmins.name,
  role: platformAdmins.role,
  status: platformAdmins.status,
  mustChangePassword: platformAdmins.mustChangePassword,
  totpEnabled: platformAdmins.totpEnabled,
  lastLoginAt: platformAdmins.lastLoginAt,
  createdAt: platformAdmins.createdAt,
} as const;

export async function listAdmins(): Promise<AdminRow[]> {
  const db = getDb();
  const rows = await db.select(COLS).from(platformAdmins).orderBy(desc(platformAdmins.createdAt));
  return rows as AdminRow[];
}

export async function getAdminById(id: string): Promise<AdminRow | null> {
  const db = getDb();
  const [row] = await db.select(COLS).from(platformAdmins).where(eq(platformAdmins.id, id)).limit(1);
  return (row as AdminRow) ?? null;
}

export async function countActiveAdmins(): Promise<number> {
  const db = getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(platformAdmins)
    .where(eq(platformAdmins.status, "active"));
  return Number(n);
}

/** Create a platform admin. Returns the new id. */
export async function createAdmin(input: { email: string; name?: string; password: string; mustChangePassword?: boolean }): Promise<string> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address.");
  const issue = passwordIssue(input.password);
  if (issue) throw new Error(issue);
  const db = getDb();
  const [existing] = await db.select({ id: platformAdmins.id }).from(platformAdmins).where(eq(platformAdmins.email, email)).limit(1);
  if (existing) throw new Error("A platform admin with that email already exists.");
  const passwordHash = await hashPassword(input.password);
  const [row] = await db
    .insert(platformAdmins)
    .values({ email, name: input.name?.trim() || null, passwordHash, mustChangePassword: input.mustChangePassword ?? true })
    .returning({ id: platformAdmins.id });
  return row.id;
}

/** Enable / disable an admin. Refuses to disable the last active admin. */
export async function setAdminStatus(id: string, status: "active" | "disabled"): Promise<void> {
  const db = getDb();
  if (status === "disabled") {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(platformAdmins)
      .where(and(eq(platformAdmins.status, "active"), ne(platformAdmins.id, id)));
    if (Number(n) === 0) throw new Error("You can't disable the last active administrator.");
  }
  await db.update(platformAdmins).set({ status, updatedAt: new Date() }).where(eq(platformAdmins.id, id));
}

/** Reset an admin's password (forces a change at next sign-in). */
export async function resetAdminPassword(id: string, newPassword: string): Promise<void> {
  const issue = passwordIssue(newPassword);
  if (issue) throw new Error(issue);
  const db = getDb();
  const passwordHash = await hashPassword(newPassword);
  await db
    .update(platformAdmins)
    .set({ passwordHash, mustChangePassword: true, updatedAt: new Date() })
    .where(eq(platformAdmins.id, id));
}

/** Change own password (clears the must-change flag). */
export async function changeOwnPassword(id: string, newPassword: string): Promise<void> {
  const issue = passwordIssue(newPassword);
  if (issue) throw new Error(issue);
  const db = getDb();
  const passwordHash = await hashPassword(newPassword);
  await db
    .update(platformAdmins)
    .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
    .where(eq(platformAdmins.id, id));
}
