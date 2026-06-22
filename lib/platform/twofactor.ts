import { randomBytes, createHash } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "../db";
import { platformAdmins, platformLoginChallenges } from "../db/schema";
import { hashPassword, verifyPassword } from "./password";
import { generateTotpSecret, otpauthURL, verifyTotp, generateBackupCodes, normalizeBackupCode } from "./totp";

const CHALLENGE_TTL_MS = 5 * 60_000;

/* --- Enrollment ---------------------------------------------------------- */

/** Begin TOTP enrollment: store a fresh (pending) secret, return it + the URI. */
export async function beginTotpEnrollment(adminId: string, accountEmail: string): Promise<{ secret: string; otpauth: string }> {
  const secret = generateTotpSecret();
  const db = getDb();
  // Stash the secret but keep 2FA disabled until a code is confirmed.
  await db.update(platformAdmins).set({ totpSecret: secret, totpEnabled: false, updatedAt: new Date() }).where(eq(platformAdmins.id, adminId));
  return { secret, otpauth: otpauthURL(secret, accountEmail) };
}

/** Confirm enrollment with a code; on success enable 2FA + return backup codes (shown once). */
export async function confirmTotpEnrollment(adminId: string, code: string): Promise<string[]> {
  const db = getDb();
  const [admin] = await db.select({ secret: platformAdmins.totpSecret }).from(platformAdmins).where(eq(platformAdmins.id, adminId)).limit(1);
  if (!admin?.secret) throw new Error("Start enrollment first.");
  if (!verifyTotp(admin.secret, code)) throw new Error("That code didn't match. Check your authenticator and try again.");
  const plainCodes = generateBackupCodes(10);
  const hashed = await Promise.all(plainCodes.map((c) => hashPassword(normalizeBackupCode(c))));
  await db.update(platformAdmins).set({ totpEnabled: true, totpBackupCodes: hashed, updatedAt: new Date() }).where(eq(platformAdmins.id, adminId));
  return plainCodes;
}

/** Disable 2FA and clear all secrets/backup codes. */
export async function disableTotp(adminId: string): Promise<void> {
  const db = getDb();
  await db.update(platformAdmins).set({ totpEnabled: false, totpSecret: null, totpBackupCodes: [], updatedAt: new Date() }).where(eq(platformAdmins.id, adminId));
}

/* --- Login challenge (second step) -------------------------------------- */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Issue a single-use challenge after a correct password (2FA pending). */
export async function createLoginChallenge(adminId: string): Promise<string> {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  await db.insert(platformLoginChallenges).values({
    tokenHash: hashToken(token),
    adminId,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
  });
  // Opportunistically clear expired challenges.
  await db.delete(platformLoginChallenges).where(lt(platformLoginChallenges.expiresAt, new Date()));
  return token;
}

/** Resolve a live challenge to its admin id, or null. */
export async function resolveChallenge(token: string): Promise<string | null> {
  if (!token) return null;
  const db = getDb();
  const [row] = await db
    .select({ adminId: platformLoginChallenges.adminId })
    .from(platformLoginChallenges)
    .where(and(eq(platformLoginChallenges.tokenHash, hashToken(token)), gt(platformLoginChallenges.expiresAt, new Date())))
    .limit(1);
  return row?.adminId ?? null;
}

export async function consumeChallenge(token: string): Promise<void> {
  const db = getDb();
  await db.delete(platformLoginChallenges).where(eq(platformLoginChallenges.tokenHash, hashToken(token)));
}

/** Verify a TOTP code or a one-time backup code for the challenged admin. */
export async function verifySecondFactor(adminId: string, code: string): Promise<boolean> {
  const db = getDb();
  const [admin] = await db
    .select({ secret: platformAdmins.totpSecret, backup: platformAdmins.totpBackupCodes })
    .from(platformAdmins)
    .where(eq(platformAdmins.id, adminId))
    .limit(1);
  if (!admin?.secret) return false;
  if (verifyTotp(admin.secret, code)) return true;

  // Fall back to a one-time backup code (consumed on use).
  const candidate = normalizeBackupCode(code);
  const remaining = admin.backup ?? [];
  for (let i = 0; i < remaining.length; i++) {
    if (await verifyPassword(candidate, remaining[i])) {
      const next = remaining.slice(0, i).concat(remaining.slice(i + 1));
      await db.update(platformAdmins).set({ totpBackupCodes: next }).where(eq(platformAdmins.id, adminId));
      return true;
    }
  }
  return false;
}

export async function backupCodesRemaining(adminId: string): Promise<number> {
  const db = getDb();
  const [row] = await db.select({ backup: platformAdmins.totpBackupCodes }).from(platformAdmins).where(eq(platformAdmins.id, adminId)).limit(1);
  return (row?.backup ?? []).length;
}
