# FAQ

*Frequently asked questions about running, using, and extending Open Air.*

## Purpose

Answer the questions that come up most often, with pointers to the deeper docs.

## General

**What is Open Air?**
A premium color-exploration platform: discover AA-gated OKLCH palettes, build complete color systems in the Studio, preview them on a real UI in the Showroom, publish to a community, and govern shared brand kits as a team.

**Do I need an account to use it?**
No. The gallery, all Studio tools, the linter, and the Showroom work signed-out. Accounts unlock saving, collections, publishing, teams, and the API.

**Is it open source?**
The code is © Open Air, all rights reserved. See [../LICENSE](../LICENSE).

## Setup

**What's the absolute minimum to run it?**
`npm ci && npm run dev`. The static catalog needs no configuration. See [getting-started.md](./getting-started.md).

**Which keys do I actually need?**
Only what you want to test. Accounts need `DATABASE_URL` + `AUTH_SECRET` + one auth provider. See [environment.md](./environment.md) and `SETUP-KEYS.md`.

**`npm ci` fails with `EBADPLATFORM` — why?**
A lockfile generated on a different OS. Regenerate on Linux: `npm install`, commit. See [troubleshooting.md](./troubleshooting.md).

## Product

**How is the plan decided?**
Server-side from the Stripe subscription — never trusted from the client. See [billing.md](./billing.md).

**What's the difference between `/admin` and `/sys`?**
`/admin` is gone (it redirects to `/sys`). `/sys` is the isolated **System Administrator** console with its own login, 2FA, and audit log. See [authentication.md](./authentication.md).

**Can I export my data?**
Yes — individual GDPR export in `/account`, and full team export from the team's Danger Zone (owner-only). Audit logs export as CSV/JSON.

**How does "live sync" work?**
A brand kit is served as design tokens (DTCG/CSS/SCSS/Tailwind/JSON) at a stable, token-authenticated URL with ETag polling. See [api.md](./api.md).

## Accessibility

**Why does the linter flag AAA, not AA?**
Every color can host AA text with black or white, so the meaningful signal is **AAA** capability. See [accessibility.md](./accessibility.md).

## Operations

**What happens if the database goes down?**
Public browsing keeps working — it's served from the static snapshot. Accounts/teams/admin require Postgres. See [RUNBOOK.md](./RUNBOOK.md).

## Related

- [getting-started.md](./getting-started.md) · [environment.md](./environment.md) · [troubleshooting.md](./troubleshooting.md)
- [billing.md](./billing.md) · [authentication.md](./authentication.md) · [api.md](./api.md)
