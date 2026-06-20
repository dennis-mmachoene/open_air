import { env } from "./env";

/**
 * Admin allow-list, sourced from the ADMIN_EMAILS env var (comma-separated):
 *   ADMIN_EMAILS="alice@example.com,bob@example.com"
 * Granting/revoking admin is a one-line env change — no code edit or migration.
 * Defaults to an empty set, so no one is admin unless explicitly listed.
 *
 * Admin detection is provider-agnostic: it matches on the verified email, so it
 * works identically for Google sign-in and email magic links. Emails are
 * canonicalised before comparison (lowercased, +tags dropped, and — for Gmail —
 * dots removed), so any alias of the same inbox matches a single allow-list
 * entry.
 *
 * This module reads server env, so it must only be imported from server code.
 * The client nav reads `session.user.isAdmin` instead (set in the auth session
 * callback) and never imports this file.
 */

/** Collapse an address to a canonical form for equality checks. */
export function canonicalEmail(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return e;
  let local = e.slice(0, at);
  const domain = e.slice(at + 1);
  // Drop a "+tag" suffix (alias convention across most providers).
  const plus = local.indexOf("+");
  if (plus !== -1) local = local.slice(0, plus);
  // Gmail/Googlemail ignore dots in the local part.
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
  }
  return `${local}@${domain}`;
}

export function parseAdminEmails(raw: string | null | undefined): ReadonlySet<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

const ADMIN_EMAILS = parseAdminEmails(env.ADMIN_EMAILS);
const ADMIN_CANONICAL = new Set([...ADMIN_EMAILS].map(canonicalEmail));

export function isAdminEmail(
  email: string | null | undefined,
  allow: ReadonlySet<string> = ADMIN_EMAILS,
): boolean {
  if (!email) return false;
  const set =
    allow === ADMIN_EMAILS ? ADMIN_CANONICAL : new Set([...allow].map(canonicalEmail));
  return set.has(canonicalEmail(email));
}
