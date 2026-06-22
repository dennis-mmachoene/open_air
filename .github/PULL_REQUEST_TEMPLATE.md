## Summary

<!-- What does this change and why? Link any related issue: Closes #123 -->

## Type of change

- [ ] ✨ Feature
- [ ] 🐛 Fix
- [ ] ♻️ Refactor
- [ ] 📝 Docs
- [ ] 🧰 Chore / CI

## How was it tested?

<!-- Commands run, scenarios covered -->

```bash
npm run lint && npm run typecheck && npm run test:all && npm run build
```

## Checklist

- [ ] The pipeline is green locally (lint · typecheck · tests · build).
- [ ] New domain logic lives in `lib/` and has tests.
- [ ] UI uses the shared `components/ui` kit + tokens (no new ad-hoc radii).
- [ ] No secrets committed; `process.env` not read outside `lib/env.ts`.
- [ ] Added a migration (and `db:check` passes) if the schema changed.
- [ ] Docs updated if behavior changed.

## Screenshots / notes

<!-- Before/after for UI changes; anything reviewers should know -->
