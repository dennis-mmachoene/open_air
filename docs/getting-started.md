# Getting Started

*Clone to running Open Air locally — and the path to a fully-configured instance.*

## Purpose

Get a contributor or operator from a fresh `git clone` to a running application as quickly as possible, then layer on the database, auth, billing, and admin capabilities as needed.

## Overview

Open Air is a Next.js 16 application. It **boots with zero configuration** — the public gallery, the Studio tools, the linter, and the Showroom all run from a static `snapshot.json` of 108 palettes. Accounts, teams, community, billing, AI, and the System Administrator console activate as you add credentials, each degrading gracefully when its keys are absent.

There are three tiers, in increasing order of setup:

| Tier | You get | You need |
|---|---|---|
| **A** | Public catalog, all Studio tools, Showroom | nothing |
| **B** | Accounts, teams, community, `/sys` admin | a database + a couple of secrets |
| **C** | Production deployment | the above + production env + CI |

## Prerequisites

- **Node 22+** and npm — `node -v` should print `v22.x`.
- (Tier B+) A Postgres database. [Neon](https://neon.tech) is the assumed host; any Postgres works.

## Detailed walkthrough

### Tier A — just run it

```bash
npm ci            # install from the committed lockfile (or: npm install)
npm run dev       # http://localhost:3000
```

Browse the gallery, open every Studio tool, run the linter, drive the Showroom. No account required.

### Tier B — full local app

```bash
npm ci
cp .env.example .env.local          # then edit it — see ./environment.md
npm run db:migrate                  # apply migrations 0000–0014
npm run db:seed                     # optional: load the catalog into Postgres
npm run platform:admin -- create you@example.com "Your Name"   # optional: /sys admin
npm run dev
```

The minimum to unlock accounts is `DATABASE_URL`, `AUTH_SECRET`, and **one** auth provider (Google OAuth *or* email/SMTP). Generate a secret with `npx auth secret`.

There's also a one-shot helper that performs the safe steps (and only touches the DB when `DATABASE_URL` is set):

```bash
bash scripts/setup.sh
```

### Tier C — production build

```bash
npm ci
npm run db:migrate
npm run build
npm start
```

In production, `DATABASE_URL` and `AUTH_SECRET` are **required** — the server fails closed without them (see [environment.md](./environment.md)). Deploy details live in [deployment.md](./deployment.md).

## Verify your setup (the CI gate, locally)

```bash
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm test                # unit tests (Vitest)
npm run test:integration  # in-process Postgres integration tests
npm run db:check        # migration ↔ schema drift
npm run build           # production build
```

Then open `/status` for a live component-health view and `/api/health` for boolean checks.

## Best practices

- Use **`npm ci`** (not `npm install`) for reproducible installs; it respects the committed lockfile.
- Keep the lockfile honest with a pre-push hook: `npm run verify:lockfile`.
- Generate the lockfile on **Linux** (or in CI) — a Windows-generated lockfile can omit `optional` flags and break `npm ci` on `ubuntu-latest`.
- Don't commit `.env.local` (it's git-ignored). Store `DATABASE_URL` + `AUTH_SECRET` in a password manager.

## Notes & common pitfalls

- **"It builds with no env" is by design** — the static snapshot powers reads. A blank `/status` simply means a subsystem's keys aren't set; that's expected, not a bug.
- **`npm run db:seed` needs `DATABASE_URL`.** Without a database, skip it; the snapshot still serves the catalog.
- **Email is a no-op without SMTP** — invites and receipts are logged, not sent, until `AUTH_EMAIL_SERVER`/`AUTH_EMAIL_FROM` are configured.

## Related

- [environment.md](./environment.md) · all environment variables
- [architecture.md](./architecture.md) · how the system fits together
- [authentication.md](./authentication.md) · sign-in & the admin plane
- [deployment.md](./deployment.md) · shipping to production
