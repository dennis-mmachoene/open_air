import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { env } from "../env";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

/** Lazily-constructed Drizzle client. Throws a clear error if DATABASE_URL is
 *  unset, so the static (snapshot-driven) read paths never accidentally hit it. */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — copy .env.example to .env.local");
  }
  if (!_db) {
    _db = drizzle(neon(env.DATABASE_URL), { schema });
  }
  return _db;
}

export { schema };
