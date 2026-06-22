# Troubleshooting

*Common failures and their fixes — local dev, CI, database, and runtime.*

## Purpose

A fast lookup for the problems contributors and operators actually hit, with the exact remedy.

## Overview

Most issues fall into four buckets: install/lockfile, environment/config, database/migrations, and runtime. Each below is a real, observed failure mode.

## Detailed explanation

### `npm ci` fails with `EBADPLATFORM`

```
npm error notsup Unsupported platform for @esbuild/aix-ppc64@…
```

**Cause:** the committed `package-lock.json` was generated on a different OS (often Windows) and omitted `optional` flags on platform-native packages, so `npm ci` tries to install binaries for the wrong platform.

**Fix:** regenerate on Linux and commit:

```bash
npm install          # rewrites the lockfile correctly on linux/node-22
npm ci                # verify it now passes
npm run verify:lockfile   # add this to a pre-push hook
```

### CI is red even though local dev works

Run the gate locally:

```bash
npm run lint && npm run typecheck && npm run test:all && npm run db:check && npm run build
```

The lockfile and `db:check` jobs are the usual culprits — see above and below.

### `db:check` fails (migration drift)

The schema changed without a matching migration. Generate one:

```bash
npm run db:generate && npm run db:migrate
```

### The server won't boot in production

`lib/env.ts` fails closed. The error names the exact variable:

```
Invalid environment variables:
  • DATABASE_URL: required in production
```

Set the named variable (see [environment.md](./environment.md)). Remember grouped subsystems are all-or-nothing.

### Sign-in does nothing / magic link never arrives

- Magic links require **database sessions** — `DATABASE_URL` must be set.
- Email requires SMTP (`AUTH_EMAIL_SERVER`/`AUTH_EMAIL_FROM`); without it, mail is logged, not sent.
- On a LAN/IP, set `AUTH_URL` so callbacks don't point at `localhost`.

### Stripe plan doesn't update after checkout

The webhook isn't reaching you or can't verify. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and set the printed `STRIPE_WEBHOOK_SECRET`.

### Can't sign in to `/sys`

Create or reset a platform admin:

```bash
npm run platform:admin -- create you@example.com "You"
npm run platform:admin -- reset  you@example.com
```

2FA is mandatory by default — you'll be prompted to enroll an authenticator after the first sign-in.

### `next build` fails fetching Google Fonts

This happens only in **network-restricted sandboxes** (`next/font` can't reach Google Fonts). It builds fine on CI/Vercel with internet.

## Best practices

- Reproduce CI locally before pushing (`test:all` + `build`).
- Keep the lockfile generated on Linux; gate it with `verify:lockfile`.
- Watch `/status` and `/api/health` after deploys.

## Related

- [deployment.md](./deployment.md) · the CI pipeline
- [environment.md](./environment.md) · required variables
- [database.md](./database.md) · migrations
- [RUNBOOK.md](./RUNBOOK.md) · incident response
