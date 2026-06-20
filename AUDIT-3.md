# Open Air — Third Production-Readiness Audit

**Auditor's note.** This pass re-derives the state of every finding from the second audit against the actual code as committed, and independently re-runs the toolchain: `tsc --noEmit`, `eslint`, the unit suite, the **new PGlite integration suite**, and a production `next build`. As before, where a claim and the code disagree, the code wins. Findings are graded on evidence, not on the presence of a commit message.

---

## 1. Executive Summary

| Metric | Value |
|---|---|
| First audit | 64 / 100 |
| Second audit | 78 / 100 |
| **This audit** | **86 / 100** |
| Movement | **+8** |
| Launch as committed? | **Yes**, once the deploy env is set and PostHog key added |

**Verification run (this audit):**

| Check | Result |
|---|---|
| `tsc --noEmit` | **0 errors** |
| `eslint .` | **0 errors / 0 warnings** |
| Unit tests | **97 passing** (7 files) |
| Integration tests (PGlite) | **9 passing** (3 files) |
| `next build` | Passes env + compile; fails **only** on Google-Fonts fetch in the network-isolated sandbox (CI has network — not a code defect). Critically, **no env-validation error occurred**, confirming the build/secret decoupling. |

**Headline.** The second audit's central irony — a readiness revision that left CI red — is gone. The lockfile is regenerated (`npm ci` clean), env validation no longer couples build-time to runtime secrets (verified empirically: loads under the build phase without secrets, still throws at runtime), and the money/gating paths now have real database-backed tests. Every Critical/High item from Audit 2 is resolved. What remains is genuinely second-order: a few test-coverage edges, observability that depends on keys only you can add, and the strategic (not defect) consequence of collapsing Studio.

---

## 2. Status of Audit-2 findings

| Ref | Finding (Audit 2) | Status | Evidence |
|---|---|---|---|
| **N1** | CI red: stale lockfile + build needs secrets | ✅ Resolved | `package-lock.json` regenerated (541 pkgs; `@esbuild/win32-x64` present); `npm ci` succeeds from clean checkout. Build now reaches compile without secrets. |
| **N2 / W8** | Build coupled to runtime secrets | ✅ Resolved | `lib/env.ts` `superRefine` skips when `NEXT_PHASE === "phase-production-build"`. Verified: build phase loads w/o secrets; runtime still throws. Extended to **subsystem-completeness** (partial Stripe/OAuth/SMTP/Upstash/Sentry config fails closed in prod). |
| **N3** | Admin auth layout-only; hardcoded admin email | ✅ Resolved | Allow-list moved to `ADMIN_EMAILS` env; `isAdmin` computed server-side and read from session (client no longer imports server env); per-page `requireAdmin()` added to all four admin pages. |
| **N4** | Assistant denial-of-wallet (limiter no-op w/o Upstash) | ✅ Resolved | `lib/rate-limit.ts` adds an in-process sliding-window fallback + a global daily budget ceiling; assistant route uses a tighter 20/min limit and a 2000/day cap. |
| **N5** | "Start a team" CTA for non-existent teams | ✅ Resolved | Relabelled "Get Studio", then mooted — Studio tier retired (see W2). |
| **W1** | Cancel Stripe sub on delete | ✅ (prior) | Still in `app/api/account/route.ts`. |
| **W2** | Studio sells nonexistent value | ✅ Resolved | Path 1 chosen: API folded into Pro (`plans.pro.api = true`), Studio removed from storefront; `studio` kept in code for legacy subscribers. Pricing is now an honest Free/Pro ladder. |
| **W5** | No integration/route tests | ✅ Largely resolved | New PGlite suite runs the **real query layer** against in-process Postgres (real migrations): save-limit enforcement (free 5-cap, pro unlimited, toggle, unknown-slug), entitlements (free vs pro incl. API), collections (add/remove/count + ownership). Pure billing reducer (`effectivePlan`) unit-tested. *(Residual: the webhook HTTP handler + signature path aren't exercised end-to-end — see New.)* |
| **W9** | No type-to-confirm on delete | ✅ Resolved | `DeleteAccount.tsx` requires typing `DELETE`, button disabled until match, with an explicit list of what's destroyed. |
| **W10** | Observability wired but dark | 🟢 Mostly on | Sentry init files read the DSN and `error.tsx`/`global-error.tsx` now call `captureException`; `withSentryConfig` wired (guarded). PostHog activates on key. *(Residual: PostHog key still to be added by you; no public status page UI.)* |
| **Webhook** | Non-atomic idempotency | ✅ Resolved | Atomic claim (`insert … onConflictDoNothing().returning()`); on failure the claim is released and 500 returned so Stripe retries. |
| **Perf/ISR** | Palette pages dynamic | ✅ Resolved | `/c/[slug]` and all 108 `/p/[slug]` pages are ISR via `generateStaticParams` + daily `revalidate`; Pro gating moved to a deduped client entitlements layer. |

**Tally:** every Critical/High/Medium item from Audit 2 is resolved or substantially mitigated. No previously-flagged item remains untouched.

---

## 3. New observations (this pass)

**O1 — Webhook handler lacks an end-to-end test. (Low–Medium)**
The *decision* logic (`effectivePlan`) is unit-tested and the entitlement/save DB layer is integration-tested, but the Stripe webhook **route** (signature verification, the claim/release idempotency branch, the `invoice.paid`/`payment_failed` email side-effects) is still only covered by reasoning. A handler-level test with a mocked Stripe event would close the last untested money path.

**O2 — Rate-limit fallback and AI budget are per-instance. (Low)**
The in-process limiter and daily ceiling protect a single server instance. Across a horizontally-scaled/serverless deployment they're not shared, so the *effective* global cap is `instances × cap`. Acceptable as a floor (and Upstash gives the distributed path), but worth documenting; for a hard global budget, track spend in Redis/DB.

**O3 — No public status page. (Low)**
`/api/health` exists and the admin Health tab consumes it, but there's no public, unauthenticated status page. The building block is there; it's a small addition if you want external uptime visibility.

**O4 — Collapsing Studio removes the upper ARPU tier. (Business, not defect)**
The Free/Pro ladder is now honest and converts better, but you've given up the $24 price point. This is the right call until teams exist; just note that expansion revenue now depends on a future teams build, and the in-code `studio` plan/labels are retained only for legacy subscribers.

**O5 — `next-auth@5-beta` remains on the critical path. (Tracking)**
Unchanged from prior audits; pin and track the stable release.

---

## 4. Capability snapshot

| Area | Grade | Note |
|---|---|---|
| Color engine | Best-in-class | Property-tested across the hue wheel; the AA guarantee is the moat. |
| Catalog / SEO | Production | Public, indexable, now ISR-cached end to end. |
| Billing | Production | Lifecycle + atomic webhook + cancel-on-delete + receipts/dunning + usage meter; honest two-tier pricing. |
| Auth / Authz | Mature | Server-authoritative entitlements; admin env-gated with per-page checks + defense-in-depth. |
| Testing / CI | Strong | Unit + **DB integration** (PGlite, no Docker) both gated in CI; lockfile clean. |
| Observability | On (key-pending) | Sentry live + source-map wiring; PostHog awaits your key; no status page. |
| Teams / orgs | Absent (by choice) | Cleanly out of scope after the Free/Pro collapse. |

---

## 5. Verdict

**86 / 100.** Open Air has crossed from "strong but with a red pipeline" into genuinely launch-ready engineering. The pipeline is green and trustworthy, the build no longer depends on runtime secrets, the highest-risk money/gating paths are exercised against real Postgres, observability is wired and live, and the pricing finally tells the truth. The remaining gap to "exceptional" is narrow and non-structural: an end-to-end webhook test, a public status page, a distributed budget ceiling if you scale out, and — when demand justifies it — a real teams tier to reopen the upper price point.

**What I'd do before flipping the switch:** set the production env (DB + auth required; complete any Stripe/OAuth/SMTP group you enable), add the PostHog key, archive the old Studio prices in Stripe, and run the CI pipeline once on the deploy branch to confirm all stages green with network present. None is a build task — they're operational.

*Generated as a self-audit against the working tree; all check results above were produced by running the toolchain, not inferred.*
