/**
 * Admin allow-list. Kept as a plain config so granting/revoking admin is a
 * one-line change (no migration). Swap or extend ADMIN_EMAILS as needed.
 * This module stays free of server-only imports so the nav can use isAdminEmail.
 */
export const ADMIN_EMAILS: ReadonlySet<string> = new Set(
  ["dennism.ramara@gmail.com", "openair.mailer@gmail.com"].map((e) => e.toLowerCase()),
);

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && ADMIN_EMAILS.has(email!.toLowerCase());
}
