# Open Air — Environment Keys & Setup Guide

How to obtain every value in `.env.example`, with the exact commands to run. Work top to bottom; **you only need the groups for the features you want to test.**

> **Golden rule:** the app runs with an empty `.env.local` (static catalog only). Add a group → that subsystem turns on. In production, only `DATABASE_URL` and `AUTH_SECRET` are hard-required; each grouped subsystem is all-or-nothing.

```bash
# 0. Create your local env file
cp .env.example .env.local
# then edit .env.local and fill in the groups you need
```

---

## Quick reference

| Group | Keys | Where to get them | Needed for |
|---|---|---|---|
| Core | `NEXT_PUBLIC_SITE_URL` | you choose | metadata, links |
| Database | `DATABASE_URL` | Neon | accounts, teams, billing, admin |
| Auth secret | `AUTH_SECRET` | `npx auth secret` | sessions |
| Google OAuth | `AUTH_GOOGLE_ID/SECRET` | Google Cloud Console | Google sign-in |
| Email/SMTP | `AUTH_EMAIL_SERVER`, `AUTH_EMAIL_FROM` | Gmail / Resend / etc. | magic links, all email |
| AI | `GEMINI_API_KEY`, `GEMINI_MODEL` | Google AI Studio | real AI director |
| Stripe | `STRIPE_*` | Stripe Dashboard + `npm run stripe:setup` | billing / Pro |
| Rate limit | `UPSTASH_REDIS_REST_*` | Upstash | distributed limits |
| Analytics | `NEXT_PUBLIC_POSTHOG_*` | PostHog | product analytics |
| Sentry | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN/ORG/PROJECT` | Sentry | error monitoring |
| Security | `CSP_ENFORCE` | you choose | enforce CSP |
| Platform admin | `PLATFORM_BOOTSTRAP_*` | you choose / CLI | `/sys` console |

---

## 1. Core — `NEXT_PUBLIC_SITE_URL`

No account needed.
- **Local:** `http://localhost:3000`
- **Phone on your Wi-Fi:** your computer's LAN IP, e.g. `http://192.168.1.20:3000`. Find it with:
  ```bash
  # macOS / Linux
  ipconfig getifaddr en0 2>/dev/null || hostname -I
  # Windows (PowerShell)
  (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.PrefixOrigin -eq 'Dhcp'}).IPAddress
  ```
  When using a LAN IP, also set `AUTH_URL` to the same value so sign-in emails/redirects don't point at `localhost`.

---

## 2. Database — `DATABASE_URL` (Neon Postgres)

1. Create a free account at **https://neon.tech** and a new project.
2. In the project dashboard open **Connection Details** → choose the **Pooled** connection → copy the `postgresql://…` string.
3. Paste it into `DATABASE_URL`.
4. Apply the schema:
   ```bash
   npm run db:migrate     # creates all tables (migrations 0000–0014)
   npm run db:seed        # loads the 108-palette catalog (optional)
   ```

*Any Postgres works (Supabase, Railway, local `postgres`), but Neon is the assumed host.*

---

## 3. Auth secret — `AUTH_SECRET`

Generate a strong random secret:
```bash
npx auth secret
# or:
openssl rand -base64 33
```
Copy the output into `AUTH_SECRET`. (Required in production.)

---

## 4. Google OAuth — `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`

1. **https://console.cloud.google.com** → create/select a project.
2. **APIs & Services → OAuth consent screen** → configure (External; add your email as a test user).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
4. **Authorized redirect URIs** — add:
   ```
   http://localhost:3000/api/auth/callback/google
   https://YOUR_PROD_DOMAIN/api/auth/callback/google
   ```
5. Copy the **Client ID** → `AUTH_GOOGLE_ID`, **Client secret** → `AUTH_GOOGLE_SECRET`.

---

## 5. Email / SMTP — `AUTH_EMAIL_SERVER` / `AUTH_EMAIL_FROM`

Powers magic-link sign-in **and** every transactional email (invites, receipts, proposal notifications). Without it those are logged, not sent.

`AUTH_EMAIL_SERVER` is a Nodemailer connection string. Pick one:

**Gmail (quickest for testing)**
1. Enable **2-Step Verification** on the Google account.
2. **Google Account → Security → App passwords** → create one for "Mail".
3. Build the string (URL-encode `@` in the username as `%40`):
   ```
   smtps://openair.mailer%40gmail.com:YOUR_16_CHAR_APP_PASSWORD@smtp.gmail.com:465
   ```

**Resend (recommended for production)** — https://resend.com → API Keys:
```
smtps://resend:re_YOUR_API_KEY@smtp.resend.com:465
```

**Mailgun / Postmark / SES** — use the SMTP credentials from their dashboard:
```
smtps://SMTP_USER:SMTP_PASS@smtp.your-provider.com:465
```

Set the sender:
```
AUTH_EMAIL_FROM="Open Air <openair.mailer@gmail.com>"
```

Test it:
```bash
npm run dev
# go to /signin, request a magic link, confirm the email arrives
```

---

## 6. AI — `GEMINI_API_KEY` / `GEMINI_MODEL`

Optional — without it the AI director falls back to local keyword matching.
1. **https://aistudio.google.com/app/apikey** → **Create API key**.
2. Paste into `GEMINI_API_KEY`.
3. `GEMINI_MODEL` — `gemini-2.0-flash` (fast/cheap) or `gemini-1.5-pro`.

---

## 7. Stripe billing — `STRIPE_*`

Use **Test mode** keys until you're live.

1. **https://dashboard.stripe.com** → **Developers → API keys** → copy the **Secret key** (`sk_test_…`) → `STRIPE_SECRET_KEY`.
2. Create the products/prices and print their IDs:
   ```bash
   npm run stripe:setup
   ```
   Paste the printed `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_PRO_YEARLY` into `.env.local`.
3. **Webhook secret:**
   - **Local:** install the Stripe CLI, then:
     ```bash
     stripe login
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     # copy the printed whsec_… into STRIPE_WEBHOOK_SECRET
     ```
   - **Production:** Dashboard → **Developers → Webhooks → Add endpoint** →
     `https://YOUR_DOMAIN/api/stripe/webhook` → copy the **Signing secret** (`whsec_…`).
4. Test card at checkout: `4242 4242 4242 4242`, any future expiry, any CVC.

*(The `STRIPE_PRICE_STUDIO_*` vars are legacy — leave blank unless you have existing Studio subscribers.)*

---

## 8. Rate limiting — `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`

Optional. Without it, rate limits use per-instance memory (fine for one instance). For multi-instance production:
1. **https://upstash.com** → create a **Redis** database.
2. Open the DB → **REST API** section → copy **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**.

---

## 9. Analytics — `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`

Optional.
1. **https://posthog.com** → create a project.
2. **Project settings → Project API Key** → copy into `NEXT_PUBLIC_POSTHOG_KEY`.
3. `NEXT_PUBLIC_POSTHOG_HOST` — `https://us.i.posthog.com` (US) or `https://eu.i.posthog.com` (EU).

---

## 10. Error monitoring — Sentry

Optional; no-op until set.
1. **https://sentry.io** → create a project (platform: Next.js).
2. **Settings → Client Keys (DSN)** → copy the DSN into **both** `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`.
3. *(Build-time source-map upload, CI/deploy only)* **Settings → Auth Tokens** → create a token with `project:releases` scope:
   - `SENTRY_AUTH_TOKEN` = the token
   - `SENTRY_ORG` = your org slug
   - `SENTRY_PROJECT` = your project slug

---

## 11. Security — `CSP_ENFORCE`

- Leave `"false"` (or unset) to ship Content-Security-Policy in **Report-Only** mode (safe default).
- After deploying and confirming the CSP report stream has **no false positives**, set `CSP_ENFORCE="true"` to enforce it.

---

## 12. System Administrator (`/sys`) — `PLATFORM_BOOTSTRAP_*`

This seeds the **first** platform Super Admin (isolated from normal user accounts).

**Option A — env bootstrap (seeded on first boot, when no admins exist):**
```
PLATFORM_BOOTSTRAP_EMAIL="openair.mailer@gmail.com"
PLATFORM_BOOTSTRAP_PASSWORD="a-strong-password-12+chars"   # min 12 chars
PLATFORM_BOOTSTRAP_NAME="Super Admin"
```
Then visit `/sys/login`. You'll be forced to set a new password, and **2FA enrollment is mandatory** (an authenticator app — Google Authenticator, 1Password, Authy).

**Option B — CLI (create/reset anytime; needs `DATABASE_URL`):**
```bash
npm run platform:admin -- create you@example.com "Your Name"
# reset a password later:
npm run platform:admin -- reset  you@example.com
```

> Rotate the bootstrap password after first sign-in, then you can clear `PLATFORM_BOOTSTRAP_PASSWORD` from the env.

---

## Verify your setup

```bash
npm install            # install dependencies
npm run db:migrate     # apply DB schema (needs DATABASE_URL)
npm run dev            # start at NEXT_PUBLIC_SITE_URL

# health & sanity
#   open /status                — component health (db/auth/email/billing/AI…)
#   open /api/health            — boolean checks, no secrets
npm run typecheck && npm run lint && npm test   # the CI gate, locally
```

If a subsystem looks "off" in `/status`, it usually means that group's keys aren't set — that's expected, not a bug. If the server refuses to boot in production, the error message names the exact missing/half-set variable.

---

## Minimum configurations by goal

| Goal | Set just these |
|---|---|
| Browse + Studio tools + linter | *(nothing)* |
| Accounts, dashboard, teams, community | `DATABASE_URL`, `AUTH_SECRET`, **+ Google OAuth or Email** |
| Billing / Pro upgrade | the above **+ all `STRIPE_*` (Pro)** |
| Real AI director | `GEMINI_API_KEY` |
| System Administrator console | `DATABASE_URL`, `AUTH_SECRET`, `PLATFORM_BOOTSTRAP_*` |
| Full production | all groups + `CSP_ENFORCE="true"` + Sentry + PostHog + Upstash |

*Security note: `.env.local` is git-ignored — never commit it. Keep a copy of `DATABASE_URL` and `AUTH_SECRET` in your password manager (they're needed for disaster recovery — see `docs/RUNBOOK.md`).*
