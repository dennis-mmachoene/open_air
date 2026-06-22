# Performance

*How Open Air stays fast — static snapshots, ISR, client-side compute, and cheap polling.*

## Purpose

Explain the performance model: what's static, what's server-rendered, what's computed in the browser, and the caching strategy that keeps it all quick.

## Overview

Open Air is fast by construction: the public catalog is **static**, authenticated pages use **server components + ISR**, the Studio computes **client-side** (no round-trips), and the token-sync API uses **ETag/304** so consumers rarely re-download.

## Detailed explanation

### Static-first catalog

The 108-palette catalog renders from `snapshot.json`. Catalog pages (`/p/[slug]`, `/c/[slug]`) are statically generated and revalidated with **ISR** — fast first paint, indexable, and resilient to a database outage.

```bash
npm run palettes:snapshot   # rebuild the snapshot after catalog changes
```

### Server components + streaming

Authenticated surfaces (dashboard, teams, `/sys`) are React Server Components — data is fetched on the server and HTML streams to the client. Route-level `loading.tsx` skeletons prevent layout shift while data resolves.

### Client-side Studio

Every Studio tool runs in the browser using `culori` — generation, scales, tokens, linting, CVD simulation — so there are no server round-trips and nothing is uploaded (image extraction included).

### Cheap token sync

`GET /api/v1/kits/:id/tokens` returns a strong **ETag**. Consumers send `If-None-Match` and get **`304 Not Modified`** unless the colors changed — polling is nearly free. See [api.md](./api.md).

### Rate limits & budgets

Upstash-backed (or in-memory fallback) rate limiting protects expensive endpoints; the AI endpoint also has a daily budget ceiling to cap spend.

## Best practices

- Regenerate the snapshot after catalog edits; keep the public path static.
- Add a `loading.tsx` skeleton for any new data-heavy route to avoid pop-in.
- Poll the token API with ETags, not on a re-download timer.
- Configure Upstash in production so limits are distributed across instances.

## Notes & common pitfalls

- Without Upstash, rate limits are **per-instance** — fine for a single instance, not for horizontal scale.
- Heavy client tools (contrast matrix, Showroom) should be verified at phone widths.
- `listOrgsForUser` historically issued a per-org count query; prefer grouped queries as data grows.

## Related

- [architecture.md](./architecture.md) · request flow & layers
- [api.md](./api.md) · ETag polling
- [accessibility.md](./accessibility.md) · responsive & reduced-motion
