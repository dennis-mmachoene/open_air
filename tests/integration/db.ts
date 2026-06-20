import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import * as schema from "../../lib/db/schema";
import { __setDbForTests } from "../../lib/db";

const MIGRATIONS_DIR = join(process.cwd(), "drizzle");

/** Spin up an in-process Postgres, apply every committed migration, and wire it
 *  into lib/db so the real query functions run against it. */
export async function makeTestDb() {
  const client = new PGlite({ extensions: { pg_trgm } });
  const db = drizzle(client, { schema });

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const raw = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    for (const stmt of raw.split("--> statement-breakpoint")) {
      const trimmed = stmt.trim();
      if (trimmed) await client.exec(trimmed);
    }
  }

  __setDbForTests(db);
  return { db, client };
}

/** Truncate every app table between tests for isolation. Discovers tables
 *  dynamically so it never drifts from the schema. */
export async function resetDb(db: Awaited<ReturnType<typeof makeTestDb>>["db"]) {
  const res = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const rows = (res as unknown as { rows?: { tablename: string }[] }).rows ?? res;
  const names = (rows as { tablename: string }[]).map((r) => `"${r.tablename}"`);
  if (names.length === 0) return;
  await db.execute(
    sql.raw(`TRUNCATE TABLE ${names.join(", ")} RESTART IDENTITY CASCADE`),
  );
}

/** Insert a user and return its id. */
export async function seedUser(
  db: Awaited<ReturnType<typeof makeTestDb>>["db"],
  opts: { plan?: "free" | "pro" | "studio"; email?: string } = {},
) {
  const email = opts.email ?? `u${Math.random().toString(36).slice(2)}@test.dev`;
  const [row] = await db
    .insert(schema.users)
    .values({ email, plan: opts.plan ?? "free" })
    .returning({ id: schema.users.id });
  return row.id;
}

/** Insert a minimal valid palette and return its id. */
export async function seedPalette(
  db: Awaited<ReturnType<typeof makeTestDb>>["db"],
  slug: string,
) {
  const [row] = await db
    .insert(schema.palettes)
    .values({
      slug,
      name: slug,
      tagline: "t",
      story: "s",
      harmony: "complementary",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      roles: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      why: {} as any,
    })
    .returning({ id: schema.palettes.id });
  return row.id;
}
