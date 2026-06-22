# Environment Variables

*Every variable Open Air reads, where to get it, and how partial configuration is handled.*

## Purpose

Document the complete, validated environment surface so a clean deploy either works or **fails closed** with a precise error — never silently half-on.

## Overview

All variables are validated by `lib/env.ts` using Zod. **Never read `process.env` directly elsewhere** — import the typed `env` object instead. In production, `DATABASE_URL` and `AUTH_SECRET` are required; everything else is optional and degrades gracefully. Grouped subsystems are **all-or-nothing**: set every key in a group, or none — a half-set group fails the boot on purpose, because partial credentials are almost always a misconfiguration and a fail-open risk.

> `NEXT_PUBLIC_*` values are exposed to the browser. **Never put secrets there.**

## Variables

### Core

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | — | Base URL for metadata, OG images, canonical links |
| `DATABASE_URL` | **prod** | Neon Postgres pooled connection string |
| `AUTH_SECRET` | **prod** | Auth.js session secret (`npx auth secret`) |

### Authentication (group: set both, or neither)

| Variable | Group |
|---|---|
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth |
| `AUTH_EMAIL_SERVER` / `AUTH_EMAIL_FROM` | Email / SMTP (magic links + transactional mail) |

### Billing — Stripe (group)

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY` are required together. `STRIPE_PRICE_STUDIO_MONTHLY` / `STRIPE_PRICE_STUDIO_YEARLY` are legacy/optional.

### AI, rate limiting, analytics, errors

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` / `GEMINI_MODEL` | AI color director (falls back to local matching) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting (group) |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Product analytics |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error reporting (group) |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Build-time source-map upload (CI only) |

### Security & platform admin

| Variable | Purpose |
|---|---|
| `CSP_ENFORCE` | `"true"` enforces CSP; otherwise Report-Only |
| `PLATFORM_BOOTSTRAP_EMAIL` / `PLATFORM_BOOTSTRAP_PASSWORD` / `PLATFORM_BOOTSTRAP_NAME` | Seed the first `/sys` Super Admin on boot |
| `ADMIN_EMAILS` | Legacy app-level admin allow-list (retained for back-compat) |

## Code example

```ts
// lib/env.ts (excerpt) — validated, typed, fail-closed
import { z } from "zod";
const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  // …
}).superRefine((v, ctx) => {
  if (v.NODE_ENV === "production" && !v.DATABASE_URL) {
    ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "required in production" });
  }
});
export const env = EnvSchema.parse(process.env);
```

```ts
// Everywhere else — import the typed object, never process.env
import { env } from "@/lib/env";
if (env.GEMINI_API_KEY) { /* real AI path */ } else { /* local fallback */ }
```

## Best practices

- Copy `.env.example` → `.env.local` and fill only the groups you need.
- For phone testing over your LAN, set `NEXT_PUBLIC_SITE_URL` **and** `AUTH_URL` to your machine's IP so magic-link emails don't point at `localhost`.
- Keep production secrets in your host's secret store (e.g. Vercel env), not in the repo.

## Notes & common pitfalls

- **Half-configured group** → boot fails naming the missing key. Configure all of a group or none.
- **`NEXT_PUBLIC_` leakage** — anything with that prefix ships to the client bundle.
- **Build vs runtime** — the production required-vars check is skipped during `next build` (which sets `NODE_ENV=production` before runtime secrets exist) and runs when the server actually boots.

## Related

- [getting-started.md](./getting-started.md) · the full setup walkthrough
- [billing.md](./billing.md) · Stripe keys & webhook
- [authentication.md](./authentication.md) · auth provider keys
- [security.md](./security.md) · CSP, headers, secrets handling
