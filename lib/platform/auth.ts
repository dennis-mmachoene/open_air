import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SYS_COOKIE, SESSION_TTL_DAYS, resolveSession, revokeToken, type PlatformAdmin } from "./sessions";

export type { PlatformAdmin } from "./sessions";

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SYS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/sys",
    maxAge: SESSION_TTL_DAYS * 86400,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SYS_COOKIE)?.value;
  if (token) await revokeToken(token);
  jar.delete(SYS_COOKIE);
}

/** Current platform admin from the cookie, or null. */
export async function getPlatformAdmin(): Promise<PlatformAdmin | null> {
  const jar = await cookies();
  const token = jar.get(SYS_COOKIE)?.value;
  if (!token) return null;
  return resolveSession(token);
}

/**
 * Gate a console page. Redirects to /sys/login when unauthenticated, and — when
 * the platform requires 2FA (default on) — to /sys/security until the admin has
 * enrolled. Pages that must remain reachable during enrollment pass
 * `allow2faSetup: true` (the security + password screens).
 */
export async function requirePlatformAdmin(opts: { allow2faSetup?: boolean } = {}): Promise<PlatformAdmin> {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/sys/login");
  if (!opts.allow2faSetup && !admin.totpEnabled) {
    const { getSetting } = await import("./settings");
    const required = (await getSetting<boolean>("require_2fa")) ?? true;
    if (required) redirect("/sys/security?required=1");
  }
  return admin;
}
