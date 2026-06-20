import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

/** Resolve the session and 404 anyone who isn't an allow-listed admin. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminEmail(session.user.email)) {
    notFound(); // 404 rather than 403 — don't reveal the admin area exists
  }
  return session;
}
