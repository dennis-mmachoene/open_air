# Open Air — Product Roadmap

*Working plan to take Open Air from "a beautiful, accessible color gallery" to "the platform teams use to create, validate, govern, and ship color systems." Sequenced by dependency and value, grounded in the current codebase. Draft for review — nothing here is built yet.*

---

## The three pillars (the filter for every feature)

1. **System** — turn a single color into a complete, production-ready design system.
2. **Guarantee** — prove the system works everywhere and for everyone (accessibility, gamut, print, motion).
3. **Govern** — manage that system across people, teams, and products.

If a proposed feature doesn't strengthen one of these, it doesn't get built.

---

## Where we are today (the foundation these waves build on)

Already shipped and tested (89/100 in the latest audit, 99 unit + 10 integration tests, green CI once the lockfile is fixed):

- **Engine:** OKLCH color (`culori`), client-side `generatePalette`, WCAG-AA contrast gating, harmony classification.
- **Catalog:** 108-palette static snapshot; Gallery; ISR palette/collection/category pages; SEO.
- **Showroom:** token-driven (`--p-*`) specimen library that re-themes live.
- **Studio (today):** generator, image-extract, gradient studio, accessibility center + CVD simulation, accessibility repair.
- **Accounts:** Auth.js (Google + magic link), saves, collections (manager + picker), generated palettes, recently-viewed, onboarding.
- **Billing:** Stripe Free/Pro, server-side entitlements, usage meter.
- **Platform:** public API v1 (keyed, rate-limited), conversational auth-aware AI assistant, admin console, 14-document legal suite, security headers.

**What this means for the roadmap:** several roadmap items are *extensions of things that already exist* (gradients, CVD, repair, AI refinement), not greenfield. That's called out per wave below. The genuinely new primitive — and the highest-value next feature — is the **tonal scale engine**.

---

## Sequencing principles

1. **Stabilize before we extend.** The audit's two blockers (CI lockfile, mobile nav) come first — they cost hours and gate everything.
2. **Build the primitive before the things that depend on it.** Tonal scales underpin semantic tokens, the contrast matrix, exports, and governance. It's the keystone of Wave 1.
3. **Individual value before team value.** Each wave should make a solo Pro user's product better before it makes a team's product better — that's where adoption and revenue start.
4. **Re-introduce the Studio tier only when it's earned.** We collapsed Studio into Pro for honesty. It comes back (Wave 6) when teams/governance/community give it real, non-vaporware value — exactly as the original plan intended.
5. **Accessibility stays a guarantee, not a feature.** Every wave keeps the "provably accessible" promise and protects it with tests.

Effort key: **S** = hours · **M** = days · **L** = 1–2 weeks · **XL** = multi-week.

---

## Milestone 0 — Stabilize & harden *(do first; ~days)*

Closes Audit #4 and the "final 1%." No new product surface; pure trustworthiness.

| Item | Pillar | Effort | Notes |
|---|---|---|---|
| Regenerate + commit `package-lock.json`; add a merge gate that runs `npm ci` on a clean checkout | — | S | I1. The recurring break. Make it impossible to ship red. |
| **Mobile navigation drawer** (hamburger → accessible focus-trapped sheet) | — | M | I2. Primary nav is desktop-only today. |
| Promote CSP from Report-Only → enforced (after a clean report window); plan nonce-based to drop `'unsafe-inline'` | Guarantee | S–M | I4. |
| Cap AI assistant input (message + history length) before the LLM call | Guarantee | S | I3. Softer denial-of-wallet. |
| Lighthouse/axe accessibility gate in CI | Guarantee | S | Defends the core promise automatically. |
| Public status page (fed by `/api/health`) + one-page DR runbook | Govern | S | Enterprise-trust signal; building block already exists. |

**Exit criteria:** CI green from a clean checkout, mobile nav usable, CSP enforced, a11y gate live.

---

## Wave 1 — Production Color Systems *(the keystone)*

**Goal:** selecting one color produces a complete, exportable design system. This is the single biggest leap and unlocks most later waves.

| Feature | Pillar | Effort | Build vs extend |
|---|---|---|---|
| **Tonal scale engine** (50→950, perceptually smooth via OKLCH; per-tone HEX/RGB/HSL/OKLCH, luminance, best-foreground, AA/AAA) | System + Guarantee | L | New — engine primitives exist |
| **Semantic token generator** (primary/secondary/accent/surface/bg/fg/border/muted/card/overlay + hover/active/focus/disabled/selected + brand-harmonized status colors) | System | L | New — maps onto existing `--p-*` role model |
| **Tiered token architecture** (primitive → semantic → component) with full-hierarchy export | System | M | New |
| **Token versioning** (history, restore, compare, semantic diff, change summaries) | Govern | L | New — needs schema (`design_systems`, `versions`) |

**New data:** a "design system" object (versioned) layered above today's palettes. **New exports:** the full token hierarchy.
**Tier:** tonal scales + semantic tokens land in **Pro**. **Why first:** everything downstream (contrast matrix, governance, live sync, SDKs) consumes these tokens.

---

## Wave 2 — Accessibility Intelligence

**Goal:** accessibility is guaranteed *before* export, across conditions — not checked after.

| Feature | Pillar | Effort | Build vs extend |
|---|---|---|---|
| **Full N×N contrast matrix** (every pair: AA/AAA/fail, ratio, recommended text; sort/filter best↔worst) | Guarantee | M | New — contrast util exists |
| **Whole-system stress testing** (deuter/protan/tritan/achromatopsia, grayscale, reduced brightness, glare, high-contrast, dark/light, print) + per-sim scorecard | Guarantee | M | Extend — CVD sim already exists |
| **Wide-gamut support** (sRGB / Display P3 / Rec.2020-prep; original→clamped→diff; flag unrepresentable) | Guarantee | M | New |
| **Print intelligence** (CMYK, ink coverage, out-of-gamut, nearest-swatch, preview) | Guarantee | M | New |

**Tier:** matrix + stress testing in **Pro**; advanced print/gamut can headline Pro too.
**Why here:** it operates on Wave-1 scales/tokens and deepens the moat (accessibility-by-construction).

---

## Wave 3 — Color in Motion + Data Visualization

**Goal:** gradients, elevation, and viz palettes become first-class and production-safe.

| Feature | Pillar | Effort | Build vs extend |
|---|---|---|---|
| **Perceptual gradient engine** (OKLCH/OKLab; linear/radial/angular/mesh; no muddy midpoints) | System | M | Extend — gradient studio exists |
| **Gradient accessibility** (continuous scan, contrast-failure regions, safe-text zones, fixes) | Guarantee | M | New |
| **Elevation system** (ambient/directional/tinted shadows, surface overlays, depth colors) | System | M | New |
| **Categorical viz palettes** (5/8/12/20; max distinguishability, CVD-safe, print-safe) | System + Guarantee | M | New |
| **Sequential/diverging/cyclical/heatmap/terrain scales** (perceptually uniform) | System + Guarantee | M | New |
| **Visualization repair** (upload chart/palette → fix conflicts, spacing, a11y, keep hierarchy) | Guarantee | L | Extend — repair concept exists |

**Tier:** **Pro** for individuals; the **data-viz toolkit** becomes a headline **Studio** (team) capability later.

---

## Wave 4 — Intelligence & AI Creation

**Goal:** Open Air feels like an expert color director, not a generator. Extends the assistant we already shipped.

| Feature | Pillar | Effort | Build vs extend |
|---|---|---|---|
| **AI palette creation from brief** ("calm healthcare brand" → primary + tonal scales + semantic tokens + a11y validation + rationale) | System | L | Extend assistant + Wave 1 |
| **Guided conversational refinement** ("warmer", "more trustworthy", "better for finance") with explained adjustments | System | M | Extend assistant |
| **Brand voice engine** (language → color adjustments) | System | M | New |
| **Taste profile** (learn preferred hues/contrast/industries; personalize) | System | M | New — needs interaction history |
| **Trend intelligence** (industry/seasonal trends, popular combos, adoption stats) | — | M | New — data-dependent; lower priority |

**Tier:** AI-assisted creation + refinement become a defining **Pro** capability (and a reason to upgrade from Free).
**Why after Waves 1–3:** the AI should output *systems* (scales, tokens, validated accessibility), which only exist once those engines do.

---

## Wave 5 — Community & Publishing *(Phase 10)*

**Goal:** turn the gallery into a community of high-quality, documented, accessible systems. Celebrates craftsmanship, not random generation.

| Feature | Pillar | Effort | Build vs extend |
|---|---|---|---|
| **Visibility model** (private / unlisted / public) on palettes, systems, collections | Govern | M | New — schema + access checks |
| **Publishing** (palettes, design systems, brand kits, gradient/viz packs) with description, rationale, a11y score, exports, tags, cover, license | System + Govern | L | New |
| **Creator profiles** (bio, links, followers, published work, downloads/likes/saves, badges) | — | L | New |
| **Inspiration feed** (trending, new, staff picks, industry, most-saved; personalized) | — | L | New — replaces static gallery surface |
| **Social** (like, bookmark, follow, comment, share, remix-with-permission, report) | Govern | L | New + moderation |
| **Licensing** (public-domain / attribution / commercial / custom) shown on each palette | Govern | M | New |

**Tier:** **publishing + creator profile = Pro** (Free can browse/like/save but not publish or use AI creation). This is a major new growth loop (every public share is discovery + a backlink).
**Dependency:** needs the visibility model and a moderation/reporting path before anything goes public.

---

## Wave 6 — Governance & Teams *(re-introduces the Studio tier)*

**Goal:** Open Air becomes the source of truth for an organization's color. This is where the **Studio** tier earns its price.

| Feature | Pillar | Effort | Build vs extend |
|---|---|---|---|
| **Orgs, seats, roles** (the multi-tenant foundation) | Govern | XL | New — orgs/members/invites + seat billing |
| **Brand Kits** (primary colors, forbidden colors, preferred harmonies, tone limits, a11y targets that every generated palette must respect) | Govern + Guarantee | L | New |
| **Shared libraries** (org / team / project / personal) | Govern | L | New |
| **Review workflow** (draft→review→approved→deprecated→archived; comments, approvals, history, audit trail) | Govern | L | New |
| **Token governance** (usage, deprecated/unused tokens, breaking-change tracking) | Govern | L | New — consumes Wave-1 tokens |

**Tier:** **Studio** ($-team) returns with real substance: brand kits, shared workspaces, governance, review, team libraries, multi-seat, collaborative AI, org profiles, the data-viz toolkit.
**Why this late:** multi-tenant auth + seat billing is the largest and riskiest build (security surface); it should follow proven single-user value and demand signal (watch the now-live analytics for team intent).

---

## Wave 7 — Linting & Live Sync

**Goal:** color systems become living infrastructure that analyzes real products and propagates changes.

| Feature | Pillar | Effort | Build vs extend |
|---|---|---|---|
| **Website scanner** (public URL → hardcoded/duplicate colors, contrast fails, missing semantic tokens, report) | Guarantee + Govern | L | New |
| **CSS/SCSS/Tailwind/Styled scanner** (dup/unused vars, hardcoded hex, naming) | Govern | M | New |
| **Figma analysis** (token validation, missing semantics, duplicate styles, a11y review) | Govern | L | New — Figma API |
| **Token endpoints + formats** (REST/JSON/CSS/Tailwind/Style-Dictionary/Android/iOS/Flutter/W3C tokens) | System | M | Extend — exports exist |
| **Live updates** (palette change → apps notified, versions bump, breaking changes flagged) | Govern | L | New — webhooks/subscriptions |
| **Official SDKs** (JS/TS/React/Next/Vue/Angular/RN/Flutter/Swift/Kotlin) | System | XL | New — ongoing |

**Tier:** linting + live sync are **Studio** headline features. **Dependency:** needs Wave-1 tokens and Wave-6 governance to be meaningful.

---

## Wave 8 — Enterprise

**Goal:** clear regulated-organization procurement. The legal suite already started this.

| Feature | Pillar | Effort |
|---|---|---|
| SSO / SAML / SCIM provisioning | Govern | L |
| Audit logs (beyond webhook events) | Govern | M |
| VPAT-style accessibility-compliance reporting (natural extension of AA-by-construction) | Guarantee | M |
| Internationalization (i18n) — relevant to a "global" launch | — | L |
| Data residency, SLA, advanced permissions, enterprise support | Govern | L |

**Tier:** **Enterprise**.

---

## Tier evolution (how pricing tracks the waves)

| Tier | Today | After Waves 1–4 | After Waves 5–6 | After Waves 7–8 |
|---|---|---|---|---|
| **Free** | Browse, save 5, basic export | + tonal-scale *viewing*, a11y education, community browse/like/save | + community discovery | unchanged (never gate understanding) |
| **Pro** | Unlimited saves, Studio tools, API | + tonal scales, semantic tokens, contrast matrix, stress testing, gradients, **AI creation/refinement**, **publish + creator profile** | unchanged | unchanged |
| **Studio** | *(retired)* | *(still folded into Pro)* | **returns:** teams, brand kits, governance, review, libraries, data-viz toolkit, collaborative AI | + linting, live sync, SDKs, org profiles |
| **Enterprise** | — | — | — | SSO/SAML/SCIM, audit, VPAT, residency, SLA |

---

## Recommended first three sprints

1. **Sprint 1 — Milestone 0.** Lockfile + merge gate, mobile nav drawer, CSP enforce, AI input cap, a11y CI gate, status page. *(Trust + the audit blockers.)*
2. **Sprint 2 — Tonal scale engine (Wave 1 core).** The keystone: 50→950 OKLCH scales with full per-tone contrast/format data, a Studio surface to view/tune them, and export. *(Highest single-feature value.)*
3. **Sprint 3 — Semantic tokens + contrast matrix (Wave 1 + Wave 2 start).** Generate brand-harmonized semantic/state tokens from the scales, and the N×N matrix to prove the whole set. *(Completes the "one color → a system you can trust" story.)*

After that, the natural fork is **AI creation (Wave 4)** for individual delight/conversion, or **community publishing (Wave 5)** for the growth loop — both build cleanly on Waves 1–2.

---

## Open questions for you

- **Order after Wave 1:** lead with **AI creation (Wave 4)**, **community (Wave 5)**, or **data-viz (Wave 3)**? Each is defensible; they target different goals (delight vs growth vs a new audience).
- **Teams timing:** build the orgs/seats foundation (Wave 6) early to unblock community-as-teams, or defer until single-user value + demand justify the multi-tenant lift?
- **Scope of "design system" object:** is a versioned system-above-palettes the right new primitive, or do we extend the existing palette object first and add versioning later?

*Tell me which wave/sprint to start, and I'll turn it into a detailed, phased implementation plan (schema, endpoints, UI, tests) before writing any code.*
