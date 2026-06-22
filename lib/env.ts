import { config } from "dotenv";

// CLI scripts (seed, drizzle-kit) don't get Next's automatic .env.local loading,
// so load it here. Imported for its side effect BEFORE anything reads env.
// dotenv does not override already-set vars, so .env.local wins over .env.
config({ path: ".env.local" });
config({ path: ".env" });

import { z } from "zod";

/**
 * Validated environment. Secrets live in Vercel env and are checked here so a
 * bad deploy fails closed. Phase 0 has no hard-required vars yet (DB, auth,
 * Stripe arrive in later phases); fields are optional now and will be tightened
 * as each subsystem lands. Add new vars to the schema, never read process.env
 * directly elsewhere.
 */
const EnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

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

    // Admin allow-list (legacy app-level admin; retained for back-compat only).
    ADMIN_EMAILS: z.string().min(1).optional(),

    // System Administrator bootstrap. On first boot (when no platform_admins
    // exist) a Super Admin is seeded from these. Rotate the password after the
    // first sign-in. Used only by the isolated /sys console.
    PLATFORM_BOOTSTRAP_EMAIL: z.string().email().optional(),
    PLATFORM_BOOTSTRAP_PASSWORD: z.string().min(12).optional(),
    PLATFORM_BOOTSTRAP_NAME: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    // Fail the deploy (not the user) if required production config is missing.
    // Skipped during `next build` (which sets NODE_ENV=production before the
    // runtime secrets are injected) so build-time isn't coupled to runtime
    // secrets — the check still runs when the server actually boots.
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
    if (value.NODE_ENV === "production" && !isBuildPhase) {
      for (const key of ["DATABASE_URL", "AUTH_SECRET"] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required in production`,
          });
        }
      }

      // Subsystem completeness: a partially-configured subsystem fails closed
      // rather than silently behaving as if it were off. Configure all of a
      // group's keys, or none — half-set credentials are almost always a
      // misconfiguration (and a silent fail-open risk).
      const groups: Record<string, readonly (keyof typeof value)[]> = {
        // Studio is retired (folded into Pro), so only Pro prices are required.
        // The legacy Studio price vars stay optional for existing subscribers.
        "Stripe billing": [
          "STRIPE_SECRET_KEY",
          "STRIPE_WEBHOOK_SECRET",
          "STRIPE_PRICE_PRO_MONTHLY",
          "STRIPE_PRICE_PRO_YEARLY",
        ],
        "Google OAuth": ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
        "Email (SMTP)": ["AUTH_EMAIL_SERVER", "AUTH_EMAIL_FROM"],
        "Upstash rate limiting": ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
        "Sentry": ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"],
      };
      for (const [name, keys] of Object.entries(groups)) {
        const set = keys.filter((k) => value[k]);
        if (set.length > 0 && set.length < keys.length) {
          const missing = keys.filter((k) => !value[k]);
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [missing[0]],
            message: `${name} is partially configured — also set: ${missing.join(", ")}`,
          });
        }
      }
    }
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
