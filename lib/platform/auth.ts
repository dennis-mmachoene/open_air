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

/** Gate a console page. Redirects to /sys/login when unauthenticated. */
export async function requirePlatformAdmin(): Promise<PlatformAdmin> {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/sys/login");
  return admin;
}
