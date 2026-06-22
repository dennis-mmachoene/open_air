# Changelog

*Notable changes to Open Air. Format based on [Keep a Changelog](https://keepachangelog.com); versioning is [SemVer](https://semver.org).*

## Purpose

A human-readable history of what shipped, so operators and integrators can track behavior changes.

## [Unreleased]

### Added
- Complete documentation system: README landing page, `docs/` guides, architecture/flow **diagrams (SVG)**, section **icons (SVG)**, branded **UI mockups (PNG)**, and GitHub community files.
- `GETTING-STARTED.md`, `SETUP-KEYS.md`, and `scripts/setup.sh` for a fresh-clone run path.

### Changed
- **UX refinement (Phase 2):** a shared `components/ui` kit; a token scale (radius `control/card/pill`, `shadow-overlay`, `ease-standard`); collapsed 7 ad-hoc radii to 3; app-wide `aria-live` toast feedback; route skeletons + `EmptyState`; content-first dashboard; Studio decluttered into categories; nav reconciled.

### Security
- Profile `website` validated to `http(s)` only (stored-XSS fix); `/sys` login rate-limited with mandatory TOTP 2FA; invite acceptance bound to the invited email; token-sync API rate-limited; expired invites no longer consume seats.

### Fixed
- Regenerated `package-lock.json` on Linux so `npm ci` passes on `ubuntu-latest` (platform `optional` flags); added a CI **migration-drift** gate.

## [0.8.0] — Wave 8 · Enterprise
- Organization audit log + CSV/JSON export; verified email domains with just-in-time membership provisioning; full team data export, team deletion, and an operations/DR runbook.

## [0.7.0] — Wave 7 · Linting & Live Sync
- Color/token **linter** (engine + `/studio/lint` + kit lint); **live sync** — design-token export (DTCG/CSS/SCSS/Tailwind/JSON) with ETag polling and a change webhook.

## [0.6.0] — Wave 6 · Teams & Governance
- Organizations, roles, seats, invitations; shared **brand kits**; a **review/approval** workflow; team plan gate and notifications.

## [0.5.0] — Platform Administration
- Isolated **System Administrator** console (`/sys`) with scrypt credentials, **TOTP 2FA** + backup codes, audit log, feature flags, and platform settings.

## [0.4.0] — Wave 5 · Community
- Publishing, explore feed, profiles, follows, likes, comments, reports, bookmarks, staff picks, and trends.

## [0.3.0] — Waves 2–4 · Color Intelligence
- Whole-system stress testing, wide-gamut/print, data-viz palettes, gradient a11y, elevation, chart repair; AI color director, taste profiles, trend intelligence.

## [0.2.0] — Foundations
- Catalog + gallery, palette detail, Showroom, Studio tools, accounts, collections, dashboard, billing, public API, legal/compliance suite, status page, CI.

## Related
- [roadmap.md](./roadmap.md) · what's next
- [../CHANGELOG.md](../CHANGELOG.md) · the root changelog
