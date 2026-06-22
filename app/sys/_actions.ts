"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authenticate, completeTotpLogin } from "@/lib/platform/sessions";
import { listActiveSessions, revokeSessionById } from "@/lib/platform/sessions";
import { setSessionCookie, clearSessionCookie, requirePlatformAdmin, getPlatformAdmin } from "@/lib/platform/auth";
import { beginTotpEnrollment, confirmTotpEnrollment, disableTotp } from "@/lib/platform/twofactor";
import { cookies } from "next/headers";
import { createAdmin, setAdminStatus, resetAdminPassword, changeOwnPassword } from "@/lib/platform/admins";
import { upsertFlag, deleteFlag } from "@/lib/platform/flags";
import { setSetting, deleteSetting } from "@/lib/platform/settings";
import { writeAudit } from "@/lib/platform/audit";
import { setUserPlan, type Plan } from "@/lib/platform/users";
import { resolveReports, adminRemovePalette, setFeatured } from "@/lib/social";
import { rateLimit } from "@/lib/rate-limit";

async function reqCtx() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;
  const userAgent = h.get("user-agent");
  return { ip, userAgent };
}

/* --- Authentication ------------------------------------------------------ */

const LOGIN_LIMIT = { limit: 8, windowMs: 15 * 60_000 }; // 8 attempts / 15 min

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { ip, userAgent } = await reqCtx();
  // Brute-force protection: throttle by IP and by targeted email.
  const byIp = await rateLimit(`sys-login:ip:${ip ?? "unknown"}`, LOGIN_LIMIT);
  const byEmail = await rateLimit(`sys-login:email:${email.trim().toLowerCase()}`, LOGIN_LIMIT);
  if (!byIp.success || !byEmail.success) {
    await writeAudit({ actorLabel: email.trim().toLowerCase(), action: "admin.login.throttled", targetType: "session", ip });
    redirect(`/sys/login?error=${encodeURIComponent("Too many attempts. Please wait a few minutes and try again.")}`);
  }
  const result = await authenticate(email, password, { ip: ip ?? undefined, userAgent: userAgent ?? undefined });
  if (!result.ok) {
    redirect(`/sys/login?error=${encodeURIComponent(result.error ?? "Sign-in failed.")}`);
  }
  if (result.needsTotp && result.challengeToken) {
    const jar = await cookies();
    jar.set("oa_sys_challenge", result.challengeToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/sys", maxAge: 300 });
    await writeAudit({ actorLabel: email.trim().toLowerCase(), action: "admin.login.2fa_required", targetType: "session", ip });
    redirect("/sys/login?step=totp");
  }
  await setSessionCookie(result.token!);
  await writeAudit({ actorLabel: email.trim().toLowerCase(), action: "admin.login", targetType: "session", ip });
  redirect(result.mustChangePassword ? "/sys/password" : "/sys");
}

export async function totpLoginAction(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const { ip, userAgent } = await reqCtx();
  const rl = await rateLimit(`sys-totp:ip:${ip ?? "unknown"}`, { limit: 10, windowMs: 15 * 60_000 });
  if (!rl.success) {
    redirect(`/sys/login?step=totp&error=${encodeURIComponent("Too many attempts. Please wait a few minutes and try again.")}`);
  }
  const jar = await cookies();
  const challenge = jar.get("oa_sys_challenge")?.value ?? "";
  const result = await completeTotpLogin(challenge, code, { ip: ip ?? undefined, userAgent: userAgent ?? undefined });
  if (!result.ok || !result.token) {
    redirect(`/sys/login?step=totp&error=${encodeURIComponent(result.error ?? "Verification failed.")}`);
  }
  jar.delete("oa_sys_challenge");
  await setSessionCookie(result.token!);
  await writeAudit({ action: "admin.login", targetType: "session", metadata: { method: "totp" }, ip });
  redirect(result.mustChangePassword ? "/sys/password" : "/sys");
}

export async function logoutAction(): Promise<void> {
  const admin = await getPlatformAdmin();
  await writeAudit({ actorAdminId: admin?.id ?? null, actorLabel: admin?.email ?? null, action: "admin.logout" });
  await clearSessionCookie();
  redirect("/sys/login");
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next !== confirm) redirect("/sys/password?error=Passwords%20do%20not%20match.");
  try {
    await changeOwnPassword(admin.id, next);
  } catch (e) {
    redirect(`/sys/password?error=${encodeURIComponent((e as Error).message)}`);
  }
  await writeAudit({ actorAdminId: admin.id, actorLabel: admin.email, action: "admin.password.change" });
  redirect("/sys");
}

/* --- Admin management ---------------------------------------------------- */

export async function createAdminAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    const id = await createAdmin({ email, name, password, mustChangePassword: true });
    await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "admin.create", targetType: "platform_admin", targetId: id, metadata: { email } });
  } catch (e) {
    redirect(`/sys/admins?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/sys/admins");
}

export async function setAdminStatusAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "active" | "disabled";
  try {
    await setAdminStatus(id, status);
    await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "admin.status", targetType: "platform_admin", targetId: id, metadata: { status } });
  } catch (e) {
    redirect(`/sys/admins?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/sys/admins");
}

export async function resetAdminPasswordAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const id = String(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  try {
    await resetAdminPassword(id, password);
    await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "admin.password.reset", targetType: "platform_admin", targetId: id });
  } catch (e) {
    redirect(`/sys/admins?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/sys/admins");
}

/* --- Sessions / security ------------------------------------------------- */

export async function revokeSessionAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const id = String(formData.get("id"));
  await revokeSessionById(id);
  await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "session.revoke", targetType: "platform_session", targetId: id });
  revalidatePath("/sys/security");
}

export async function revokeAllOtherSessionsAction(): Promise<void> {
  const actor = await requirePlatformAdmin();
  const sessions = await listActiveSessions();
  for (const s of sessions) await revokeSessionById(s.id);
  await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "session.revoke_all" });
  redirect("/sys/login");
}

/* --- Feature flags ------------------------------------------------------- */

export async function upsertFlagAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const key = String(formData.get("key") ?? "");
  const enabled = formData.get("enabled") === "1";
  const description = String(formData.get("description") ?? "");
  const rolloutPercent = Number(formData.get("rolloutPercent") ?? 100);
  try {
    await upsertFlag({ key, enabled, description, rolloutPercent, updatedBy: actor.email });
    await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "flag.update", targetType: "flag", targetId: key, metadata: { enabled, rolloutPercent } });
  } catch (e) {
    redirect(`/sys/flags?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/sys/flags");
}

export async function deleteFlagAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const key = String(formData.get("key"));
  await deleteFlag(key);
  await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "flag.delete", targetType: "flag", targetId: key });
  revalidatePath("/sys/flags");
}

/* --- Platform settings --------------------------------------------------- */

export async function setSettingAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const key = String(formData.get("key") ?? "");
  const raw = String(formData.get("value") ?? "");
  const description = String(formData.get("description") ?? "");
  let value: unknown = raw;
  try { value = JSON.parse(raw); } catch { /* keep as string */ }
  try {
    await setSetting({ key, value, description, updatedBy: actor.email });
    await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "setting.update", targetType: "setting", targetId: key });
  } catch (e) {
    redirect(`/sys/settings?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/sys/settings");
}

export async function deleteSettingAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const key = String(formData.get("key"));
  await deleteSetting(key);
  await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "setting.delete", targetType: "setting", targetId: key });
  revalidatePath("/sys/settings");
}

/* --- User & billing oversight ------------------------------------------- */

export async function setUserPlanAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const userId = String(formData.get("userId"));
  const plan = String(formData.get("plan")) as Plan;
  await setUserPlan(userId, plan);
  await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "user.plan.override", targetType: "user", targetId: userId, metadata: { plan } });
  revalidatePath("/sys/users");
}

/* --- Two-factor enrollment ---------------------------------------------- */

export async function startTotpAction(): Promise<void> {
  const admin = await requirePlatformAdmin();
  await beginTotpEnrollment(admin.id, admin.email);
  await writeAudit({ actorAdminId: admin.id, actorLabel: admin.email, action: "admin.2fa.enroll_start" });
  redirect("/sys/security?enroll=1");
}

export async function confirmTotpAction(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const code = String(formData.get("code") ?? "");
  try {
    const backupCodes = await confirmTotpEnrollment(admin.id, code);
    await writeAudit({ actorAdminId: admin.id, actorLabel: admin.email, action: "admin.2fa.enabled" });
    const jar = await cookies();
    jar.set("oa_sys_backup", backupCodes.join(","), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/sys", maxAge: 600 });
  } catch (e) {
    redirect(`/sys/security?enroll=1&error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect("/sys/security?backup=1");
}

export async function disableTotpAction(): Promise<void> {
  const admin = await requirePlatformAdmin();
  await disableTotp(admin.id);
  await writeAudit({ actorAdminId: admin.id, actorLabel: admin.email, action: "admin.2fa.disabled" });
  redirect("/sys/security");
}

/* --- Community moderation (migrated from the old admin area) ------------- */

export async function resolveReportsAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const id = String(formData.get("id"));
  await resolveReports(id);
  await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "moderation.report.resolve", targetType: "published_palette", targetId: id });
  revalidatePath("/sys/community");
}

export async function removePaletteAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const id = String(formData.get("id"));
  await adminRemovePalette(id);
  await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "moderation.palette.remove", targetType: "published_palette", targetId: id });
  revalidatePath("/sys/community");
}

export async function setFeaturedAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  const id = String(formData.get("id"));
  const on = formData.get("on") === "1";
  await setFeatured(id, on);
  await writeAudit({ actorAdminId: actor.id, actorLabel: actor.email, action: "moderation.palette.feature", targetType: "published_palette", targetId: id, metadata: { featured: on } });
  revalidatePath("/sys/community");
}
