import { z } from "zod";

/**
 * Validated environment. Secrets live in Vercel env and are checked here so a
 * bad deploy fails closed. Phase 0 has no hard-required vars yet (DB, auth,
 * Stripe arrive in later phases); fields are optional now and will be tightened
 * as each subsystem lands. Add new vars to the schema, never read process.env
 * directly elsewhere.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Public site URL (used for metadataBase, OG, canonical links)
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // Postgres (Neon). Optional until the DB is provisioned; the public catalog
  // is served from the static snapshot, so the app builds without it.
  DATABASE_URL: z.string().min(1).optional(),

  // Sentry — optional; error reporting is a no-op until a DSN is provided.
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${issues}\n` +
        "Check your .env file against .env.example.",
    );
  }

  return parsed.data;
}

export const env = loadEnv();
