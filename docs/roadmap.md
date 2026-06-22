# Roadmap

*Where Open Air has been and where it's going.*

## Purpose

Track the product's trajectory — shipped pillars and the candidate next steps — so contributors and stakeholders share a map.

## Overview

Open Air evolved from "a beautiful color gallery" into a platform to **create, validate, govern, and ship** production-ready color systems, organized around three pillars: **System**, **Guarantee**, **Govern** — plus a platform-operations plane.

## Shipped

| Area | Highlights |
|---|---|
| **System** | Studio: AI director, tonal scales, semantic tokens, elevation, gradients, generator, image extract, Showroom |
| **Guarantee** | Contrast/AA-AAA, CVD stress test, gamut & print, **color linter**, data-viz palettes, chart repair |
| **Govern — Community** | Publish, explore (new/top/staff picks), profiles, follows, likes, comments, reports, bookmarks, trends |
| **Govern — Teams** | Orgs, roles, seats, invites, **shared brand kits**, **review/approval workflow**, verified domains + JIT provisioning, per-tenant audit log + export, team data export & deletion |
| **Platform ops** | Isolated **System Administrator** (`/sys`) with scrypt + **TOTP 2FA**, audit log, feature flags, settings; **live token sync** API; status page; DR runbook |
| **Quality** | Hardened security (XSS, brute-force, invite binding, rate limits), CI gates (lockfile + migration drift), full **UX refinement** (token kit, toasts, skeletons, empty states) |

## Candidate next steps

- **Enterprise SSO** — OIDC then SAML/SCIM, building on the verified-domain model.
- **Observability activation** — production Sentry/PostHog; status incident history.
- **Webhook hardening** — HMAC-signed sync webhooks with retries.
- **Distribution** — a Figma plugin and an SDK/CLI over the token-sync API.
- **Help center** — in-app support and a docs site.

## Notes

This roadmap reflects intent, not commitment; priorities shift with usage. See the per-wave plans and the launch/UX roadmaps in the repository root for detail.

## Related

- [changelog.md](./changelog.md) · what shipped, by release
- [architecture.md](./architecture.md) · the system today
- [api.md](./api.md) · the token-sync surface distribution builds on
