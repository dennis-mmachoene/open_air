# API Reference

*The public palette API and the per-kit design-token sync endpoint.*

## Purpose

Document the programmatic surfaces Open Air exposes to third parties: the read-only palette API (API-key auth) and the brand-kit token-sync endpoint (per-kit token, ETag polling).

## Overview

Two public surfaces:

1. **Palette API** — `GET /api/v1/palettes`, authenticated with a Bearer **API key**, rate-limited. For programmatic catalog access (Pro/Studio).
2. **Token Sync** — `GET /api/v1/kits/:id/tokens`, authenticated with a per-kit **sync token**, with **ETag/304** support for cheap polling. Turns a team's brand kit into live design tokens.

All responses are JSON unless a token format dictates otherwise (CSS/SCSS/etc.).

## Detailed explanation

### Authentication

- **API keys** — created at `/account/api` (Pro). Send as `Authorization: Bearer <key>`.
- **Sync tokens** — created per brand kit at `/orgs/<slug>/kits/<kit>` → *Live Sync*. Send as `Authorization: Bearer <token>` or `?token=<token>`.

See [authentication.md](./authentication.md) and [security.md](./security.md).

### `GET /api/v1/palettes`

Query the catalog with filters and cursor pagination.

```bash
curl -s "https://YOUR_DOMAIN/api/v1/palettes?mood=calm&limit=20" \
  -H "Authorization: Bearer oa_live_xxx"
```

| Param | Description |
|---|---|
| `mood` / `family` / `industry` / `style` / `season` / `harmony` | Filters |
| `collection` / `q` | Collection slug / free-text search |
| `limit` / `cursor` | Page size / pagination cursor |

```json
{
  "palettes": [
    { "slug": "tidewater", "name": "Tidewater", "roles": { "primary": "#1d4ed8" } }
  ],
  "nextCursor": "…"
}
```

Headers: `X-RateLimit-Remaining`.

### `GET /api/v1/kits/:id/tokens`

Serve a brand kit as design tokens in five formats.

```bash
# DTCG (W3C design tokens), with polling
curl -s "https://YOUR_DOMAIN/api/v1/kits/KIT_ID/tokens?format=dtcg&token=oak_xxx" \
  -H 'If-None-Match: "<previous-etag>"' -i
```

| `format` | Output |
|---|---|
| `dtcg` | W3C Design Tokens JSON |
| `css` | `:root { --token: #hex; }` |
| `scss` | `$token: #hex;` |
| `tailwind` | a Tailwind config `colors` object |
| `json` | flat `{ "token": "#hex" }` |

Behavior: returns a strong **ETag** (content hash + format). A matching `If-None-Match` yields **`304 Not Modified`** with no body. Rotating the token (in the Live Sync panel) invalidates the old URL.

```js
// Poll on a build; only re-pull when colors change
const res = await fetch(url, { headers: { "If-None-Match": lastEtag } });
if (res.status === 304) return cached;
lastEtag = res.headers.get("ETag");
const tokens = await res.text();
```

### Errors

| Status | Meaning |
|---|---|
| `401` | Missing/invalid key or token |
| `403` | Plan required (palette API) |
| `404` | Unknown kit |
| `429` | Rate limit exceeded |

## Best practices

- **Poll with ETags**, not on a timer that re-downloads — you'll usually get a `304`.
- **Treat tokens as secrets.** Anyone with the sync-token URL can read the kit's colors; rotate if leaked.
- Wire the token endpoint into a Style Dictionary build or a CI step; subscribe to the kit's change webhook to rebuild on push.

## Notes & common pitfalls

- A kit-A token cannot read kit-B — the resolved `kitId` must match the URL.
- `CORS: *` on the token endpoint is intentional: the token is the credential and the payload is just colors.
- The change webhook is best-effort `https` POST (no HMAC signing yet) — verify the payload's `version` before rebuilding.

## Related

- [authentication.md](./authentication.md) · key & token issuance
- [security.md](./security.md) · rate limits, token handling
- [billing.md](./billing.md) · which plans unlock the API
