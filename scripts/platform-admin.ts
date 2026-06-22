/**
 * Create or reset a System Administrator (Super Admin) from the CLI.
 *
 *   npm run platform:admin -- create <email> [name]
 *   npm run platform:admin -- reset  <email>
 *
 * Prompts for a password (hidden). Requires DATABASE_URL.
 */
import { createInterface } from "node:readline";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { platformAdmins } from "../lib/db/schema";
import { hashPassword, passwordIssue } from "../lib/platform/password";

function ask(question: string, hidden = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  if (hidden) {
    // Mute echo for password entry.
    const out = process.stdout as unknown as { write: (s: string) => boolean };
    const orig = out.write.bind(out);
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = () => orig("");
    process.stdout.write(question);
  }
  return new Promise((resolve) => rl.question(hidden ? "" : question, (a) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(a.trim()); }));
}

async function main() {
  const [cmd, email, name] = process.argv.slice(2);
  if (!cmd || !email || !["create", "reset"].includes(cmd)) {
    console.error("Usage: npm run platform:admin -- <create|reset> <email> [name]");
    process.exit(1);
  }
  const password = await ask("New password (min 12 chars, mixed case + number): ", true);
  const issue = passwordIssue(password);
  if (issue) { console.error("✗ " + issue); process.exit(1); }
  const passwordHash = await hashPassword(password);
  const db = getDb();
  const clean = email.trim().toLowerCase();
  const [existing] = await db.select({ id: platformAdmins.id }).from(platformAdmins).where(eq(platformAdmins.email, clean)).limit(1);

  if (cmd === "create") {
    if (existing) { console.error("✗ An admin with that email already exists. Use `reset`."); process.exit(1); }
    await db.insert(platformAdmins).values({ email: clean, name: name ?? "Super Admin", passwordHash, role: "super_admin", status: "active", mustChangePassword: false });
    console.log("✓ Super Admin created:", clean);
  } else {
    if (!existing) { console.error("✗ No admin with that email. Use `create`."); process.exit(1); }
    await db.update(platformAdmins).set({ passwordHash, status: "active", mustChangePassword: false, updatedAt: new Date() }).where(eq(platformAdmins.id, existing.id));
    console.log("✓ Password reset for:", clean);
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
