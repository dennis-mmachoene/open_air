import { config } from "dotenv";

// CLI scripts (seed, drizzle-kit) don't get Next's automatic .env.local loading,
// so load it here. Imported for its side effect BEFORE anything reads env.
// dotenv does not override already-set vars, so .env.local wins over .env.
config({ path: ".env.local" });
config({ path: ".env" });
