<div align="center">

<img src="app/icon.svg" alt="Open Air" width="96" height="96" />

# Open Air

**A living gallery of color — the platform to create, validate, govern, and ship production-ready color systems.**

Browse **108** hand-tuned, AA-gated OKLCH palettes, understand *why* each one works, build complete token systems in the **Studio**, watch any palette dress a full UI in the **Showroom**, publish to a community, and govern shared brand kits as a team.

<br />

![CI](https://img.shields.io/github/actions/workflow/status/dennis-mmachoene/open-air/ci.yml?branch=main&style=for-the-badge&label=CI&logo=githubactions&logoColor=white)
![Version](https://img.shields.io/badge/version-0.8.0-6366F1?style=for-the-badge)
![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-EF4444?style=for-the-badge)
![Palettes](https://img.shields.io/badge/palettes-108-8B5CF6?style=for-the-badge)
![WCAG](https://img.shields.io/badge/WCAG-AA%20gated-14B8A6?style=for-the-badge)
![API](https://img.shields.io/badge/API-v1-0EA5E9?style=for-the-badge)

![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=000000)
![Neon](https://img.shields.io/badge/Neon%20Postgres-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)

[**Getting Started**](docs/getting-started.md) · [**Documentation**](#-documentation) · [**Architecture**](docs/architecture.md) · [**API**](docs/api.md) · [**Report a bug**](https://github.com/dennis-mmachoene/open-air/issues)

</div>

<br />

![Open Air](docs/images/hero.png)

---

## Table of contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Quick start](#-quick-start)
- [Tech stack](#-tech-stack)
- [Architecture](#-architecture)
- [Documentation](#-documentation)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## <img src="docs/icons/sparkles.svg" width="22" align="center" /> Overview

Open Air is a premium color-exploration **platform** built around three pillars:

- **System** — the **Studio** (AI director, tonal scales, semantic tokens, gradients, linter, …) and the **Showroom**, which re-themes a whole UI from `--p-*` role tokens.
- **Guarantee** — accessibility everywhere: AA/AAA contrast, color-vision-deficiency simulation, wide-gamut/print, and a color linter.
- **Govern** — a **community** (publish, follow, like, comment) and **teams** (orgs, roles, shared brand kits, a review workflow, verified domains, audit logs) — under an isolated **System Administrator** plane.

> **Zero config to explore.** The app boots with no environment variables — the public gallery runs entirely off a static `snapshot.json` of 108 palettes. Add credentials to unlock accounts, billing, AI, and admin.

---

## <img src="docs/icons/layout.svg" width="22" align="center" /> Features

| | Feature | What it does |
|---|---|---|
| <img src="docs/icons/palette.svg" width="18" /> | **Gallery** | A quiet, near-neutral shell so every saturated pixel belongs to a palette. Filter by mood, industry, family, style, or season; open any palette for its ramp, harmony, contrast pairings, and rationale. |
| <img src="docs/icons/monitor.svg" width="18" /> | **Showroom** | One click re-themes an entire UI specimen library — primitives, components, data-viz, full screens — driven purely by role tokens. |
| <img src="docs/icons/cpu.svg" width="18" /> | **Studio** | 14 client-side tools across **Create · Systematize · Validate · Data-viz**: generate, extract, scales, tokens, elevation, **linter**, stress test, gamut & print, and more. |
| <img src="docs/icons/users.svg" width="18" /> | **Teams** | Organizations with roles & seats, shared **brand kits**, a **propose → review → approve** workflow, verified domains with auto-join, and a per-tenant audit log + export. |
| <img src="docs/icons/api.svg" width="18" /> | **Live sync & API** | Serve a brand kit as design tokens (DTCG/CSS/SCSS/Tailwind/JSON) with ETag polling; a public palette API with keys + rate limiting. |
| <img src="docs/icons/shield.svg" width="18" /> | **System Admin** | An isolated `/sys` console: scrypt credentials + **TOTP 2FA**, audit log, feature flags, user/billing oversight, moderation. |
| <img src="docs/icons/credit.svg" width="18" /> | **Billing** | Free / Pro / Studio via Stripe, with entitlements derived **server-side** from the plan. |

---

## <img src="docs/icons/monitor.svg" width="22" align="center" /> Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/images/gallery.png" alt="Gallery" /><br/><sub><b>Gallery</b> — filterable, AA-gated catalog</sub></td>
    <td width="50%"><img src="docs/images/palette-details.png" alt="Palette details" /><br/><sub><b>Palette</b> — ramp, why it works, contrast</sub></td>
  </tr>
  <tr>
    <td><img src="docs/images/showroom.png" alt="Showroom" /><br/><sub><b>Showroom</b> — any palette on a real UI</sub></td>
    <td><img src="docs/images/studio.png" alt="Studio" /><br/><sub><b>Studio</b> — tools, categorized</sub></td>
  </tr>
  <tr>
    <td><img src="docs/images/dashboard.png" alt="Dashboard" /><br/><sub><b>Dashboard</b> — content-first</sub></td>
    <td><img src="docs/images/admin.png" alt="System Administrator" /><br/><sub><b>/sys</b> — isolated admin console (dark)</sub></td>
  </tr>
  <tr>
    <td><img src="docs/images/collections.png" alt="Collections" /><br/><sub><b>Collections</b> — named sets</sub></td>
    <td><img src="docs/images/mobile.png" alt="Mobile" /><br/><sub><b>Mobile</b> — light &amp; dark</sub></td>
  </tr>
</table>

---

## <img src="docs/icons/rocket.svg" width="22" align="center" /> Quick start

**Prerequisites:** Node **22+** and npm.

```bash
# 1. Run it — zero config (static catalog, all Studio tools)
npm ci && npm run dev          # → http://localhost:3000

# 2. Full app (accounts, teams, admin)
cp .env.example .env.local     # then edit — see docs/environment.md
npm run db:migrate             # apply migrations 0000–0014
npm run db:seed                # optional: load the catalog
npm run platform:admin -- create you@example.com "You"   # optional: /sys admin
npm run dev
```

Full walkthrough → **[docs/getting-started.md](docs/getting-started.md)** · every key → **[docs/environment.md](docs/environment.md)** & [SETUP-KEYS.md](SETUP-KEYS.md).

---

## <img src="docs/icons/cpu.svg" width="22" align="center" /> Tech stack

| Area | Choice |
|------|--------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript (strict) |
| **Styling** | Tailwind v4 (`@theme inline`, CSS role tokens) + a shared `components/ui` kit |
| **Color** | OKLCH via `culori`; WCAG AA/AAA contrast gating |
| **Data** | Drizzle ORM + Neon Postgres (migrations `0000`–`0014`) |
| **Auth** | Auth.js v5 (Google OAuth + magic links) · isolated `/sys` admin (scrypt + TOTP) |
| **Billing** | Stripe (Checkout, Billing Portal, idempotent webhooks) |
| **AI** | Google Gemini color director (REST, local fallback) |
| **Infra** | Upstash Redis (rate limits) · Nodemailer (SMTP) · PostHog · Sentry |
| **Tests / CI** | Vitest (unit + in-process Postgres integration) · GitHub Actions (lockfile → migrations → lint → typecheck → test → build) |

---

## <img src="docs/icons/layout.svg" width="22" align="center" /> Architecture

![Architecture](docs/diagrams/architecture.svg)

Server-first routes over pure, tested `lib/` domain logic, with a static snapshot powering public reads. Deep dive → **[docs/architecture.md](docs/architecture.md)** · schema → **[docs/database.md](docs/database.md)**.

---

## <img src="docs/icons/book.svg" width="22" align="center" /> Documentation

| | Document | |
|---|---|---|
| <img src="docs/icons/rocket.svg" width="16"/> | [Getting Started](docs/getting-started.md) | Clone → running |
| <img src="docs/icons/settings.svg" width="16"/> | [Environment](docs/environment.md) | Every variable |
| <img src="docs/icons/layout.svg" width="16"/> | [Architecture](docs/architecture.md) | System design |
| <img src="docs/icons/database.svg" width="16"/> | [Database](docs/database.md) | Schema & migrations |
| <img src="docs/icons/lock.svg" width="16"/> | [Authentication](docs/authentication.md) | Auth & the admin plane |
| <img src="docs/icons/shield.svg" width="16"/> | [Security](docs/security.md) | Posture & trust boundaries |
| <img src="docs/icons/api.svg" width="16"/> | [API](docs/api.md) | Palette API & token sync |
| <img src="docs/icons/credit.svg" width="16"/> | [Billing](docs/billing.md) | Plans, entitlements, Stripe |
| <img src="docs/icons/rocket.svg" width="16"/> | [Deployment](docs/deployment.md) | CI/CD & release checklist |
| <img src="docs/icons/sparkles.svg" width="16"/> | [Accessibility](docs/accessibility.md) | The guarantee, in & out |
| <img src="docs/icons/monitor.svg" width="16"/> | [Performance