import { env } from "./env";

/**
 * Admin allow-list, sourced from the ADMIN_EMAILS env var (comma-separated):
 *   ADMIN_EMAILS="alice@example.com,bob@example.com"
 * Granting/revoking admin is a one-line env change — no code edit or migration.
 * Defaults to an empty set, so no one is admin unless explicitly listed.
 *
 * This module reads server env, so it must only be imported from server code.
 * The client nav reads `session.user.isAdmin` instead (set in the auth session
 * callback) and never imports this file.
 */
export function parseAdminEmails(raw: string | null | undefined): ReadonlySet<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

const ADMIN_EMAILS = parseAdminEmails(env.ADMIN_EMAILS);

export function isAdminEmail(
  email: string | null | undefined,
  allow: ReadonlySet<string> = ADMIN_EMAILS,
): boolean {
  return Boolean(email) && allow.has(email!.toLowerCase());
}
