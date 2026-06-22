# Contributing to Open Air

Thanks for your interest in improving Open Air! This is the short version — the full guide is in **[docs/contributing.md](docs/contributing.md)**.

## Quick start

```bash
git checkout -b feat/your-change
npm run lint && npm run typecheck && npm run test:all && npm run build
git commit -m "feat(scope): concise summary"   # Conventional Commits
```

Open a PR and fill in the template. Keep the pipeline green on every commit.

## Principles

- **Domain logic in `lib/`** — framework-agnostic and tested.
- **Server-derived authorization** — gate features server-side, never on the client.
- **UI from the kit** — `components/ui` + the radius/motion tokens.
- **Tests with the feature** — unit (Vitest) and DB integration (in-process Postgres).
- Never read `process.env` outside `lib/env.ts`; never edit a committed migration.

By contributing you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

See **[docs/contributing.md](docs/contributing.md)** for the full conventions, the Studio-tool pattern, and the migration workflow.
