import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "../db";
import { env } from "../env";
import { platformAdmins, platformSessions } from "../db/schema";
import { hashPassword, verifyPassword } from "./password";
import { createLoginChallenge, resolveChallenge, verifySecondFactor, consumeChallenge } from "./twofactor";

export const SYS_COOKIE = "oa_sys_session";
export const SESSION_TTL_DAYS = 7;

export interface PlatformAdmin {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  mustChangePassword: boolean;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Seed the first Super Admin from env when the table is empty. Idempotent. */
export async function bootstrapSuperAdmin(): Promise<void> {
  const email = env.PLATFORM_BOOTSTRAP_EMAIL;
  const password = env.PLATFORM_BOOTSTRAP_PASSWORD;
  if (!email || !password) return;
  try {
    const db = getDb();
    const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(platformAdmins);
    if (Number(n) > 0) return;
    const passwordHash = await hashPassword(password);
    await db
      .insert(platformAdmins)
      .values({
        email: email.trim().toLowerCase(),
        name: env.PLATFORM_BOOTSTRAP_NAME ?? "Super Admin",
        passwordHash,
        role: "super_admin",
        status: "active",
        mustChangePassword: true,
      })
      .onConflictDoNothing();
  } catch (err) {
    console.error("[platform] bootstrap failed", err);
  }
}

export interface LoginResult {
  ok: boolean;
  error?: string;
  token?: string;
  mustChangePassword?: boolean;
  /** Password was correct but the admin has 2FA — finish with the challenge. */
  needsTotp?: boolean;
  challengeToken?: string;
}

/** Mint a live session for an already-authenticated admin. */
export async function mintSession(adminId: string, mustChangePassword: boolean, ctx: { ip?: string; userAgent?: string } = {}): Promise<LoginResult> {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);
  await db.insert(platformSessions).values({
    tokenHash: hashToken(token),
    adminId,
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
    expiresAt,
  });
  await db.update(platformAdmins).set({ lastLoginAt: new Date() }).where(eq(platformAdmins.id, adminId));
  return { ok: true, token, mustChangePassword };
}

/** Verify credentials and, on success, mint a session token (raw, un-stored). */
export async function authenticate(email: string, password: string, ctx: { ip?: string; userAgent?: string } = {}): Promise<LoginResult> {
  await bootstrapSuperAdmin();
  const db = getDb();
  const clean = email.trim().toLowerCase();
  const [admin] = await db.select().from(platformAdmins).where(eq(platformAdmins.email, clean)).limit(1);
  const stored = admin?.passwordHash ?? "scrypt$00$00";
  const valid = await verifyPassword(password, stored);
  if (!admin || admin.status !== "active" || !valid) {
    return { ok: false, error: "Invalid credentials or inactive account." };
  }
  if (admin.totpEnabled) {
    const challengeToken = await createLoginChallenge(admin.id);
    return { ok: true, needsTotp: true, challengeToken, mustChangePassword: admin.mustChangePassword };
  }
  return mintSession(admin.id, admin.mustChangePassword, ctx);
}

export async function resolveSession(token: string): Promise<PlatformAdmin | null> {
  if (!token) return null;
  const db = getDb();
  const [row] = await db
    .select({
      id: platformAdmins.id,
      email: platformAdmins.email,
      name: platformAdmins.name,
      role: platformAdmins.role,
      status: platformAdmins.status,
      mustChangePassword: platformAdmins.mustChangePassword,
    })
    .from(platformSessions)
    .innerJoin(platformAdmins, eq(platformAdmins.id, platformSessions.adminId))
    .where(
      and(
        eq(platformSessions.tokenHash, hashToken(token)),
        isNull(platformSessions.revokedAt),
        gt(platformSessions.expiresAt, new Date()),
        eq(platformAdmins.status, "active"),
      ),
    )
    .limit(1);
  return (row as PlatformAdmin) ?? null;
}

export async function revokeToken(token: string): Promise<void> {
  const db = getDb();
  await db.update(platformSessions).set({ revokedAt: new Date() }).where(eq(platformSessions.tokenHash, hashToken(token)));
}

export async function listActiveSessions(): Promise<{ id: string; adminEmail: string; ip: string | null; userAgent: string | null; createdAt: Date; expiresAt: Date }[]> {
  const db = getDb();
  return db
    .select({
      id: platformSessions.id,
      adminEmail: platformAdmins.email,
      ip: platformSessions.ip,
      userAgent: platformSessions.userAgent,
      createdAt: platformSessions.createdAt,
      expiresAt: platformSessions.expiresAt,
    })
    .from(platformSessions)
    .innerJoin(platformAdmins, eq(platformAdmins.id, platformSessions.adminId))
    .where(and(isNull(platformSessions.revokedAt), gt(platformSessions.expiresAt, new Date())))
    .orderBy(platformSessions.createdAt);
}

export async function revokeSessionById(id: string): Promise<void> {
  const db = getDb();
  await db.update(platformSessions).set({ revokedAt: new Date() }).where(eq(platformSessions.id, id));
}


/** Finish a 2FA login: validate the second factor against the challenge. */
export async function completeTotpLogin(challengeToken: string, code: string, ctx: { ip?: string; userAgent?: string } = {}): Promise<LoginResult> {
  const adminId = await resolveChallenge(challengeToken);
  if (!adminId) return { ok: false, error: "Your sign-in attempt expired. Please start again." };
  const ok = await verifySecondFactor(adminId, code);
  if (!ok) return { ok: false, error: "Invalid authentication code." };
  await consumeChallenge(challengeToken);
  const db = getDb();
  const [admin] = await db.select({ m: platformAdmins.mustChangePassword }).from(platformAdmins).where(eq(platformAdmins.id, adminId)).limit(1);
  return mintSession(adminId, Boolean(admin?.m), ctx);
}
