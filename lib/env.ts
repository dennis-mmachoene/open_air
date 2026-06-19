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

  // Auth.js (Phase 4). Optional until configured; sign-in is disabled without them.
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  AUTH_EMAIL_SERVER: z.string().min(1).optional(),
  AUTH_EMAIL_FROM: z.string().min(1).optional(),

  // Google Gemini (AI color concierge). Optional — falls back to local matching.
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),

  // Stripe (Phase 5). Optional until configured; billing is disabled without them.
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().min(1).optional(),
  STRIPE_PRICE_STUDIO_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_STUDIO_YEARLY: z.string().min(1).optional(),

  // Upstash Redis (rate limiting for the public API). Optional — skipped if unset.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // PostHog product analytics (optional). Pageviews are captured client-side.
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

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
