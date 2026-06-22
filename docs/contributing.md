# Contributing

*How to propose changes, the conventions we follow, and the quality bar.*

## Purpose

Make it easy to contribute well — the workflow, the standards, and how to get a change merged with the pipeline green.

## Overview

Open Air values **pure, tested domain logic**, **server-derived authorization**, and a **green pipeline at all times**. Changes are small, verified locally, and shipped behind the CI gate.

## Detailed explanation

### Workflow

```bash
git checkout -b feat/your-change
# …make the change…
npm run lint && npm run typecheck && npm run test:all && npm run build
git commit -m "feat(scope): concise summary"
git push -u origin feat/your-change   # open a PR
```

### Project conventions

- **Domain logic in `lib/`** — framework-agnostic, unit/integration tested. Routes and components stay thin.
- **Never read `process.env` directly** — import the typed `env` from `lib/env.ts`.
- **Server-side entitlements** — gate features via `getEntitlements()`/`requireRole()`, never the client.
- **UI from the kit** — use `components/ui` (`Button`, `Card`, `Input`, `Toast`, …) and the radius/motion tokens (`rounded-control/card/pill`, `ease-standard`). No new ad-hoc radii.
- **Studio tool pattern** — a pure engine `lib/color/*.ts` + Vitest tests + a client `*Tool.tsx` + a page + a `TOOLS` entry + sitemap.
- **Conventional Commits** — `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` with an optional scope.

### Tests

```bash
npm test                 # unit (Vitest)
npm run test:integration # DB integration (in-process Postgres / PGlite)
```

Add a test with the feature. DB logic is testable without external infrastructure.

### Adding a migration

```bash
npm run db:generate   # from schema changes
npm run db:migrate
npm run db:check      # must pass (CI gate)
```

Never edit a committed migration — add a new one.

## Best practices

- Keep PRs small and independently shippable; the pipeline should be green on every commit.
- Match the existing tone, terminology, and formatting (the docs read as one voice).
- Run the full gate locally before pushing — it mirrors CI exactly.

## Notes & common pitfalls

- The kit `Button` defaults to `type="button"`; in a `<form>`, pass `type="submit"`.
- Regenerate `snapshot.json` (`npm run palettes:snapshot`) after catalog changes.
- Generate the lockfile on Linux to avoid `npm ci` platform breakage.

## Related

- [getting-started.md](./getting-started.md) · local setup
- [architecture.md](./architecture.md) · where code goes
- [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) · community standards
- [../CONTRIBUTING.md](../CONTRIBUTING.md) · the short version at the repo root
