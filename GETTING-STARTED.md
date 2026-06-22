# Open Air — Getting Started (from a fresh clone)

Run these **in order**. Pick the tier you need — the app boots with **zero config** (static catalog), and each tier adds capability.

> **Prerequisites:** Node **22+** and npm. (A Postgres DB — e.g. Neon — is only needed from Tier B onward.) Check: `node -v` → v22.x.

---

## ⚡ Tier A — Just run it (no accounts, no DB)

The public gallery, Studio tools, and Showroom work off a static snapshot.

```bash
# 1. install dependencies (uses the committed lockfile)
npm ci          # or: npm install

# 2. start the dev server
npm run dev
```

Open **http://localhost:3000**. Done — browse, use every Studio tool, the linter, the Showroom.

---

## 🔐 Tier B — Full local app (accounts, teams, community, admin)

Adds sign-in, dashboard, teams, billing, the `/sys` admin console, etc. Needs a database and a couple of secrets.

```bash
# 1. install
npm ci

# 2. create your env file, then edit it (see SETUP-KEYS.md for where to get each value)
cp .env.example .env.local
#    minimum to unlock accounts:  DATABASE_URL, AUTH_SECRET, and Google OAuth OR email/SMTP
#    quick secret:                npx auth secret    → paste into AUTH_SECRET

# 3. apply the database schema (migrations 0000–0014)
npm run db:migrate

# 4. (optional) seed the 108-palette catalog into the DB
npm run db:seed

# 5. (optional) create the first System Administrator for /sys
npm run platform:admin -- create you@example.com "Your Name"
#    …or set PLATFORM_BOOTSTRAP_EMAIL / PLATFORM_BOOTSTRAP_PASSWORD in .env.local

# 6. (optional) set up Stripe products + price IDs (test mode)
npm run stripe:setup
#    then, in another terminal, forward webhooks while developing:
#    stripe listen --forward-to localhost:3000/api/stripe/webhook

# 7. run
npm run dev
```

Open **http://localhost:3000** · admin console at **http://localhost:3000/sys/login**.

> Don't have the keys yet? **`SETUP-KEYS.md`** has step-by-step instructions for every value (Neon, Google, Stripe, Gemini, etc.).

---

## 🚀 Tier C — Production build

```bash
npm ci
cp .env.example .env.local        # fill in production values (DATABASE_URL + AUTH_SECRET required)
npm run db:migrate
npm run build
npm start                         # serves the production build on :3000
```

In production, `DATABASE_URL` and `AUTH_SECRET` are **required** — the server fails closed without them. After watching CSP reports, set `CSP_ENFORCE="true"`.

---

## ✅ Verify everything (the CI gate, locally)

```bash
npm run lint            # eslint
npm run typecheck       # tsc --noEmit
npm test                # unit tests (vitest)
npm run test:integration  # DB integration tests (in-process Postgres, no setup)
npm run db:check        # migration ↔ schema drift check
npm run build           # production build
```

Or in one go: `npm run lint && npm run typecheck && npm run test:all && npm run build`.

---

## 🧰 Handy commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (hot reload) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:migrate` | Apply DB migrations |
| `npm run db:seed` | Seed the catalog from the snapshot |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run db:check` | Check migrations match the schema |
| `npm run platform:admin -- create <email> "<name>"` | Create a `/sys` Super Admin |
| `npm run platform:admin -- reset <email>` | Reset a Super Admin's password |
| `npm run stripe:setup` | Create Stripe products + print price IDs |
| `npm run palettes:snapshot` | Rebuild `snapshot.json` from source |
| `npm run verify:lockfile` | Fail if `package-lock.json` is out of sync |

---

## TL;DR

```bash
# fresh clone → running in 30 seconds (no config):
npm ci && npm run dev

# full app:
npm ci && cp .env.example .env.local   # then edit .env.local (see SETUP-KEYS.md)
npm run db:migrate && npm run db:seed
npm run platform:admin -- create you@example.com "You"
npm run dev
```

*Operator: Open Air · openair.mailer@gmail.com. Keys guide: `SETUP-KEYS.md`. Ops/DR: `docs/RUNBOOK.md`.*
