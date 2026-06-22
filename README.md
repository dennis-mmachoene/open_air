<div align="center">

<img src="app/icon.svg" alt="Open Air" width="120" height="120" />

# Open Air

**A living gallery of color — a museum of palettes you can put to work.**

Browse **108** hand-tuned, AA-gated OKLCH palettes, understand *why* each one works, then watch any palette dress a complete component library and real screens in real time in the **Showroom**.

<br />

<!-- Status & meta — update the repo path in the CI badge to match your GitHub repo -->
![CI](https://img.shields.io/github/actions/workflow/status/dennis-mmachoene/open-air/ci.yml?branch=main&style=for-the-badge&label=CI&logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-EF4444?style=for-the-badge)
![PRs](https://img.shields.io/badge/PRs-welcome-22C55E?style=for-the-badge)
![Palettes](https://img.shields.io/badge/palettes-108-8B5CF6?style=for-the-badge)

<!-- Tech stack -->
![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=000000)
![Neon Postgres](https://img.shields.io/badge/Neon%20Postgres-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

[**Live Demo**](#) &nbsp;·&nbsp; [**Report Bug**](https://github.com/dennis-mmachoene/open-air/issues) &nbsp;·&nbsp; [**Request Feature**](https://github.com/dennis-mmachoene/open-air/issues)

Designed & built by [**Dennis Ramara**](https://github.com/dennis-mmachoene)

</div>

---

## Table of Contents

- [🎨 Overview](#-overview)
- [✨ Features](#-features)
- [🧱 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Variables](#️-environment-variables)
- [🗄️ Database](#️-database)
- [💳 Stripe](#-stripe)
- [🔐 Admin](#-admin)
- [📜 Scripts](#-scripts)
- [🗂️ Project Structure](#️-project-structure)
- [🧪 Testing and CI](#-testing-and-ci)
- [📄 License](#-license)

---

## 🎨 Overview

Open Air is a premium color-exploration platform — a museum of palettes you can put to work. The **Gallery** keeps a quiet, near-neutral shell so every saturated pixel on screen belongs to a palette. The **Showroom** lets a single click re-theme an entire UI specimen library. The **Studio** generates, extracts, and repairs palettes client-side. It all runs on a static catalog snapshot, so reads work even without a database connection.

> **No setup required to explore.** The app boots with zero environment variables — the public gallery runs entirely off a static `snapshot.json` of 108 palettes. Add credentials to unlock accounts, billing, and AI.

<!-- Drop a few screenshots here to show off the Gallery, Showroom, and Studio.
<div align="center">
  <img src="docs/gallery.png" alt="Gallery" width="49%" />
  <img src="docs/showroom.png" alt="Showroom" width="49%" />
</div>
-->

---

## ✨ Features

| | Feature | What it does |
|---|---------|--------------|
| 🖼️ | **Gallery** | A quiet, near-neutral shell so every saturated pixel belongs to a palette. Filter by mood, industry, family, style, or season, then open any palette to see its ramp, harmony, contrast pairings, and rationale. |
| 🎭 | **Showroom** | Select a palette and it re-themes an entire UI specimen library (primitives, components, data-viz, full screens) at once, driven purely by `--p-*` role tokens. |
| 🎛️ | **Studio** | Generate palettes client-side (instant), extract a palette from an image, build gradients, and repair any palette for WCAG AA contrast. |
| 👤 | **Accounts** | Save palettes, organize collections, and revisit recently viewed. A two-step onboarding seeds new accounts with picks for their use-case. |
| 💳 | **Billing** | Free, Pro, and Studio tiers via Stripe, with entitlements derived **server-side** from the user's plan. |
| 🔌 | **Public API** | `GET /api/v1/palettes` with API keys and rate limiting. |
| 🛡️ | **Admin** | An allow-listed control room: overview KPIs, user management, content insights, and a health dashboard. |

---

## 🧱 Tech Stack

| Area | Choice |
|------|--------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript (strict) |
| **Styling** | Tailwind v4 (`@theme inline`, CSS role tokens) |
| **Color** | OKLCH via `culori`; WCAG AA contrast gating |
| **Data** | Drizzle ORM + Neon Postgres |
| **Auth** | Auth.js v5 (Google OAuth + email magic links, database sessions) |
| **Billing** | Stripe (Checkout, Billing Portal, webhooks) |
| **AI** | Google Gemini color concierge (REST, with local fallback) |
| **Rate limiting** | Upstash Redis |
| **Email** | Nodemailer (SMTP) |
| **Analytics / errors** | PostHog (CDN), Sentry (optional) |
| **Tests / CI** | Vitest + GitHub Actions (lint → typecheck → test → build) |

---

## 🚀 Getting Started

**Prerequisites:** Node **22+** and npm.

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template, then fill in the values you need
cp .env.example .env.local

# 3. Start the dev server
npm run dev
```

Open **<http://localhost:3000>**. The app runs immediately off the static snapshot — configure the variables below to unlock accounts, billing, and AI.

---

## ⚙️ Environment Variables

All variables are validated by `lib/env.ts` (Zod) — **never read `process.env` directly elsewhere.** In production, `DATABASE_URL` and `AUTH_SECRET` are required (the deploy **fails closed** if missing). Everything else is optional and degrades gracefully.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Base URL for metadata, OG images, canonical links |
| `DATABASE_URL` | Neon Postgres pooled connection string |
| `AUTH_SECRET` | Auth.js session secret (`npx auth secret`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials |
| `AUTH_EMAIL_SERVER` / `AUTH_EMAIL_FROM` | SMTP for magic-link + transactional email |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | AI color concierge (falls back to local matching) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe API + webhook signing |
| `STRIPE_PRICE_*` | Price IDs for Pro / Studio monthly + yearly |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Public-API rate limiting |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Product analytics |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error reporting (no-op until set) |

---

## 🗄️ Database

```bash
npm run db:generate   # generate a migration from schema changes
npm run db:migrate    # apply migrations
npm run db:seed       # seed the catalog from the snapshot
npm run db:studio     # open Drizzle Studio
```

Migrations live in `drizzle/` (currently `0000`–`0006`). After pulling changes that touch the schema, run `npm run db:migrate`.

---

## 💳 Stripe

```bash
npm run stripe:setup  # creates products/prices, prints the price IDs to paste into .env.local
```

The webhook lives at **`/api/stripe/webhook`** (idempotent via a `webhook_events` table). Plan is derived **server-side** from the Stripe price — never trusted from the client.

---

## 🔐 Admin

The admin area at **`/admin`** is gated by an email allow-list in `lib/admin.ts`:

```ts
export const ADMIN_EMAILS = new Set(
  ["dennism.ramara@gmail.com"].map((e) => e.toLowerCase())
);
```

Add or change addresses there — no migration needed. Non-admins receive a **404** rather than a 403, so the area's existence isn't advertised.

**Tabs:** **Overview** (KPIs) · **Users** (searchable) · **Content** (most-saved palettes, popular use-cases, generator harmonies) · **Health**.

A public uptime probe is exposed at **`/api/health`** — it returns boolean checks only (no secrets) and responds `503` when a critical dependency is degraded.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run palettes:snapshot` | Rebuild `snapshot.json` from source |

---

## 🗂️ Project Structure

```
app/            App Router routes (gallery, studio, dashboard, admin, api/*)
components/     UI — chrome, gallery, studio, showroom, billing, auth, admin
lib/            Domain logic — color, db, auth, plans, saves, admin, health, env
drizzle/        SQL migrations + meta
scripts/        build-snapshot, stripe-setup
tests/          Vitest suites
types/          Ambient type declarations
```

---

## 🧪 Testing and CI

```bash
npm run lint && npm run typecheck && npm test
```

GitHub Actions runs the same gate on every push and PR: **lint → typecheck → test → build**.

---

## 📄 License

© Dennis Ramara. All rights reserved.

<div align="center">
<br />
<sub>Built with Next.js, Tailwind, and a love for color · by <a href="https://github.com/dennis-mmachoene">Dennis Ramara</a></sub>
</div>