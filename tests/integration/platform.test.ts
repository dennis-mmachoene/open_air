import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb } from "./db";
import { hashPassword, verifyPassword, passwordIssue } from "../../lib/platform/password";
import {
  authenticate,
  resolveSession,
  revokeToken,
  listActiveSessions,
  revokeSessionById,
} from "../../lib/platform/sessions";
import {
  createAdmin,
  listAdmins,
  setAdminStatus,
  resetAdminPassword,
  countActiveAdmins,
  getAdminById,
} from "../../lib/platform/admins";
import { writeAudit, listAudit, auditActions } from "../../lib/platform/audit";
import { upsertFlag, listFlags, isFeatureEnabled, deleteFlag } from "../../lib/platform/flags";
import { setSetting, getSetting, listSettings } from "../../lib/platform/settings";
import { beginTotpEnrollment, confirmTotpEnrollment, disableTotp, verifySecondFactor, backupCodesRemaining } from "../../lib/platform/twofactor";
import { completeTotpLogin } from "../../lib/platform/sessions";
import { totpCode } from "../../lib/platform/totp";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

const PW = "Sup3rSecret!!";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const h = await hashPassword(PW);
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword(PW, h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
  it("enforces a strength policy", () => {
    expect(passwordIssue("short")).toBeTruthy();
    expect(passwordIssue("alllowercase123")).toBeTruthy();
    expect(passwordIssue(PW)).toBeNull();
  });
});

describe("admins", () => {
  it("creates an admin and lists it", async () => {
    const id = await createAdmin({ email: "root@open.air", password: PW, name: "Root" });
    expect(await countActiveAdmins()).toBe(1);
    const admins = await listAdmins();
    expect(admins).toHaveLength(1);
    expect(admins[0].email).toBe("root@open.air");
    expect(await getAdminById(id)).not.toBeNull();
  });
  it("rejects duplicate emails and weak passwords", async () => {
    await createAdmin({ email: "a@open.air", password: PW });
    await expect(createAdmin({ email: "a@open.air", password: PW })).rejects.toThrow();
    await expect(createAdmin({ email: "b@open.air", password: "weak" })).rejects.toThrow();
  });
  it("won't disable the last active admin", async () => {
    const id = await createAdmin({ email: "solo@open.air", password: PW });
    await expect(setAdminStatus(id, "disabled")).rejects.toThrow();
    const id2 = await createAdmin({ email: "two@open.air", password: PW });
    await setAdminStatus(id2, "disabled"); // ok, one remains
    expect(await countActiveAdmins()).toBe(1);
  });
});

describe("authentication & sessions", () => {
  it("authenticates valid credentials and resolves the session", async () => {
    await createAdmin({ email: "ops@open.air", password: PW });
    const bad = await authenticate("ops@open.air", "nope");
    expect(bad.ok).toBe(false);
    const good = await authenticate("ops@open.air", PW, { ip: "1.2.3.4" });
    expect(good.ok).toBe(true);
    const admin = await resolveSession(good.token!);
    expect(admin?.email).toBe("ops@open.air");
    expect((await listActiveSessions())).toHaveLength(1);
  });
  it("revoked sessions stop resolving", async () => {
    await createAdmin({ email: "ops2@open.air", password: PW });
    const { token } = await authenticate("ops2@open.air", PW);
    await revokeToken(token!);
    expect(await resolveSession(token!)).toBeNull();
  });
  it("disabled admins can't authenticate", async () => {
    const id = await createAdmin({ email: "x@open.air", password: PW });
    await createAdmin({ email: "keep@open.air", password: PW }); // keep one active
    await setAdminStatus(id, "disabled");
    expect((await authenticate("x@open.air", PW)).ok).toBe(false);
  });
  it("a password reset invalidates by forcing new login (old token still tied to session though)", async () => {
    const id = await createAdmin({ email: "r@open.air", password: PW });
    const { token } = await authenticate("r@open.air", PW);
    await resetAdminPassword(id, "An0therStr0ng!");
    // old session still valid until revoked; new password authenticates
    expect((await authenticate("r@open.air", "An0therStr0ng!")).ok).toBe(true);
    const sessions = await listActiveSessions();
    await revokeSessionById(sessions[0].id);
    expect(await resolveSession(token!)).toBeNull();
  });
});

describe("audit log", () => {
  it("appends and lists entries, newest first, filterable by action", async () => {
    await writeAudit({ actorLabel: "root@open.air", action: "admin.login", targetType: "session" });
    await writeAudit({ actorLabel: "root@open.air", action: "flag.update", targetType: "flag", targetId: "beta" });
    const all = await listAudit();
    expect(all).toHaveLength(2);
    expect(all[0].action).toBe("flag.update");
    const filtered = await listAudit({ action: "admin.login" });
    expect(filtered).toHaveLength(1);
    expect((await auditActions()).sort()).toEqual(["admin.login", "flag.update"]);
  });
});

describe("feature flags & settings", () => {
  it("upserts, reads, and deletes a flag", async () => {
    await upsertFlag({ key: "new_dashboard", enabled: true, description: "v2" });
    expect(await isFeatureEnabled("new_dashboard")).toBe(true);
    await upsertFlag({ key: "new_dashboard", enabled: false });
    expect(await isFeatureEnabled("new_dashboard")).toBe(false);
    expect(await isFeatureEnabled("missing")).toBe(false);
    expect(await listFlags()).toHaveLength(1);
    await deleteFlag("new_dashboard");
    expect(await listFlags()).toHaveLength(0);
  });
  it("stores typed settings as JSON", async () => {
    await setSetting({ key: "signups_open", value: false });
    await setSetting({ key: "max_seats", value: 25 });
    expect(await getSetting<boolean>("signups_open")).toBe(false);
    expect(await getSetting<number>("max_seats")).toBe(25);
    expect(await listSettings()).toHaveLength(2);
  });
});


describe("two-factor authentication", () => {
  it("enrolls, gates login behind a second factor, and accepts a valid code", async () => {
    const id = await createAdmin({ email: "tfa@open.air", password: PW });
    const { secret } = await beginTotpEnrollment(id, "tfa@open.air");
    // wrong code fails to confirm
    await expect(confirmTotpEnrollment(id, "000000")).rejects.toThrow();
    const backup = await confirmTotpEnrollment(id, totpCode(secret));
    expect(backup).toHaveLength(10);

    // password alone now returns a 2FA challenge (no session token)
    const first = await authenticate("tfa@open.air", PW);
    expect(first.ok).toBe(true);
    expect(first.needsTotp).toBe(true);
    expect(first.token).toBeUndefined();
    expect(first.challengeToken).toBeTruthy();

    // wrong code rejected
    const bad = await completeTotpLogin(first.challengeToken!, "000000");
    expect(bad.ok).toBe(false);
    // correct code mints a session
    const good = await completeTotpLogin(first.challengeToken!, totpCode(secret));
    expect(good.ok).toBe(true);
    expect(good.token).toBeTruthy();
  });

  it("consumes a one-time backup code", async () => {
    const id = await createAdmin({ email: "bk@open.air", password: PW });
    const { secret } = await beginTotpEnrollment(id, "bk@open.air");
    const backup = await confirmTotpEnrollment(id, totpCode(secret));
    expect(await backupCodesRemaining(id)).toBe(10);
    expect(await verifySecondFactor(id, backup[0])).toBe(true);
    expect(await backupCodesRemaining(id)).toBe(9);
    // same code can't be reused
    expect(await verifySecondFactor(id, backup[0])).toBe(false);
  });

  it("disabling 2FA reverts to single-factor login", async () => {
    const id = await createAdmin({ email: "off@open.air", password: PW });
    const { secret } = await beginTotpEnrollment(id, "off@open.air");
    await confirmTotpEnrollment(id, totpCode(secret));
    await disableTotp(id);
    const res = await authenticate("off@open.air", PW);
    expect(res.ok).toBe(true);
    expect(res.needsTotp).toBeFalsy();
    expect(res.token).toBeTruthy();
  });
});
