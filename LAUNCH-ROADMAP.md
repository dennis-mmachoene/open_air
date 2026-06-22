# Open Air — Post-Audit Launch & Hardening Roadmap

*Consolidates the open items from **Audit #5 (Launch Readiness)** and the **UX/UI Refinement Study** into a sequenced plan. Items already addressed in the latest hardening pass are marked **✅ DONE**; everything else is ordered by leverage. No item here changes the product's direction — it finishes and hardens what exists.*

**Status of the Audit #5 verdict:** ⚠️ *GO WITH CONDITIONS.* Of the six launch conditions, **five are resolved in code** and one (R1, the lockfile) must be run in your environment. Clearing R1 + committing flips this to a clean GO.

---

## Phase 0 — Clear the launch gate (do before tagging the release)

| Ref | Item | State | Action |
|---|---|---|---|
| **R1** | Stale `package-lock.json` breaks `npm ci` | **⛔ YOURS TO RUN** | On your dev machine / CI runner (linux, node 22): `npm install`, then commit the regenerated `package-lock.json`. Confirm `npm ci` + full pipeline go green. *(Regenerating it inside the assistant sandbox produced dependency drift — it must be done in the real CI baseline.)* Add `npm run verify:lockfile` to a **pre-push hook** so it can never go stale again. |
| **R2** | Stored XSS via profile `website` (`javascript:`) | **✅ DONE** | `safeWebsite()` now allows only `http(s)` at input **and** render-guards `/u/[handle]`; 3 unit tests added. |
| **R3** | No brute-force protection on `/sys` login; 2FA optional | **✅ DONE** | Login + TOTP steps are now IP/email rate-limited (8 / 15 min; throttle audited). **2FA is mandatory** for platform admins by default — `requirePlatformAdmin` forces enrollment via `/sys/security` (toggle with the `require_2fa` platform setting). |
| **R5** | Invite redeemable by any account holding the token | **✅ DONE** | `acceptInvite` now requires the signed-in email to equal the invited email; tests updated. |
| **R6** | No migration-drift gate in CI | **✅ DONE** | New `migrations` CI job runs `drizzle-kit check` (`npm run db:check`). |
| **R7** | Token-sync API unthrottled | **✅ DONE** | `/api/v1/kits/:id/tokens` rate-limited (60 / min per token). |
| **R9** | Expired-but-pending invites consume seats | **✅ DONE** | `seatUsage` now excludes expired invites. |
| **R4** | CSP is Report-Only (not enforcing) | **◻ PENDING** | Watch the report stream for a few days; when clean, set `CSP_ENFORCE=true`. Then iterate toward nonce-based to drop `'unsafe-inline'`. *~hours.* |

**Exit criteria for Phase 0:** green pipeline (R1) + CSP enforced (R4). The other conditions are already met.

---

## Phase 1 — Post-launch security & scale tidy-up (week 1)

| Ref | Item | Effort | Notes |
|---|---|---|---|
| **R8** | Org downgrade reconciliation | ~half day | When an owner drops below their seat plan, the over-limit team currently persists. Decide + implement behaviour: block new invites (already true via seat cap) **and** surface an "over seat limit — reduce members or upgrade" banner; optionally freeze writes until reconciled. |
| **R10** | `listOrgsForUser` N+1 member-count query | ~1 hr | Fold the per-org count into one `GROUP BY` query. Pure refactor. |
| — | Turn on **observability** | ~half day | Set real `SENTRY_DSN` + `NEXT_PUBLIC_POSTHOG_KEY`; verify events flow. (Code already gated; this is config + smoke test.) |
| — | Distributed rate-limit/budget | ~half day | The limiter falls back to per-instance memory without Upstash; set `UPSTASH_*` in production so limits are global across instances. |

---

## Phase 2 — UX/UI Refinement Program (the highest perceived-quality gain)

*From the design study. The thesis: the foundation is premium; what's missing is the **connective layer** — a shared component kit, a token scale, and consistent feedback. Do these in order; each makes the next cheaper.*

### 2.1 Foundation & consistency *(systemic — do first)*
- Add **token scales** the `@theme` lacks: radius (`--radius-control`, `--radius-card` — pick **one** card radius, `xl` *or* `2xl`, `--radius-pill`), a codified spacing rhythm (one card padding), a 2-step shadow scale (or commit to border-only), and 2–3 motion tokens (one easing).
- Build a real shared **`components/ui/` kit**: `Button`, `Card`/`SectionCard`, `Badge`, `Input`, `Select`, `ErrorNote`, `EmptyState`, `Stat`. Promote the `/sys`-only `platform/ui.tsx` into it and refactor both the app and `/sys` to consume it.
- Delete the **duplicate plan badges** and the retired **`studio`** plan styling.
- *Target: 3 border-radii in use, not 7; one primary `Button`, not a copy-pasted pattern.*

### 2.2 Action feedback *(most visible polish gap)*
- Add **one app-wide toast/snackbar** with a single style, auto-dismiss, and an `aria-live="polite"` region. Route **every** meaningful action (save, create/delete, invite, role change, publish, like, bookmark, copy, sync) through it — success *and* error. Remove the scattered inline `text-xs` messages (keep inline only for field validation). Standardize copy ("Saved to your library", "Invite sent to …", "Copied").

### 2.3 Loading & empty states
- Add route-level `loading.tsx` **skeletons** matching final layout for the data-heavy surfaces (dashboard, `/orgs`, account, community). Give every async button a consistent pending state via the shared `Button`.
- Adopt the existing **`EmptyState`** everywhere (dashboard sections, collections, `/orgs`, bookmarks, published, audit, no-results). Design the **first-session dashboard** intentionally — it's the emotional make-or-break screen.

### 2.4 IA & clutter *(Studio especially)*
- Group the **14 Studio tools** into 3–4 labelled categories (**Create / Systematize / Validate / Data-viz**) with plain-language blurbs; separate the **Showroom** from the tool directory so the page has one identity and one primary action.
- Reconcile navigation: keep primary surfaces consistent signed-in vs out (**Collections** is currently dropped from `APP_NAV`), and surface the orphaned **/trends** and **/bookmarks** — folding them into **Explore** as tabs is the cleanest, feature-free fix.

### 2.5 Hierarchy, type, forms *(per-surface polish)*
- **Dashboard:** demote the `UsageMeter` to a slim indicator near the "Saved" heading (or Account); lead with the user's content. Unify palette presentation on one `PaletteCard` + consistent grid/rail rhythm.
- **Type:** audit the **275 `text-xs`** usages — promote body/helper/label/interactive text to `text-sm` minimum; reserve `text-xs` for true chrome (timestamps, counts, badges). Apply heading sizes consistently.
- **Forms:** give every field a visible or visually-hidden `<label>` (the `InviteForm` and role `<select>` are placeholder-only today); standardize input/select via the shared primitives (one radius, keep the nice `focus:border-text`); route success through the toast.

### 2.6 Motion & responsive finish
- Apply the motion tokens to hovers/menus/toast; add restrained feedback motion to key moments (save, copy) within the existing reduced-motion guard.
- Verify the **Studio tools** (sliders, canvases, contrast matrix, Showroom) on real phone widths; consider **card layouts instead of horizontal-scroll tables** for members/audit on mobile.
- *(Optional, borderline-feature):* a manual **light/dark/system** toggle (app shell is OS-only today) — one control + a class on `<html>`, reusing existing tokens.

---

## Phase 3 — Enterprise depth (procurement unblockers)

The Wave-8 work delivered teams, roles, seats, audit, domains, data export, and a 2FA admin plane. The remaining enterprise gaps are real integrations, not a rebuild:

- **True SSO** — OIDC first (cheapest path via Auth.js: a configurable provider), then **SAML** (Okta/Azure AD) using a vetted library. Build on the existing **verified-domain** model: a verified domain can require SSO and pin an IdP. *(The domain + JIT-provisioning foundation is already shipped.)*
- **SCIM provisioning** — directory-driven create/deactivate of members for large tenants.
- **Enforced-SSO policy** per org (block password login for claimed domains).
- **Admin-login hardening, continued** — optional IP allow-listing / step-up for the super-admin.

---

## Phase 4 — Operational & business maturity

- **Help center / in-app support** — the thinnest business-readiness area; a docs site + contextual help links.
- **Status incident history** on `/status` (the page exists; add a history/postmortem feed).
- **HMAC-signed sync webhooks + retries** (currently best-effort `https` POST) — the natural hardening of Wave 7.
- **Backups automation** — schedule the `pg_dump` job from the DR runbook; verify restores quarterly.

---

## Phase 5 — Distribution & network effects (the moat)

Per the audit's closing note, once the above is done the distance to category-leader is **distribution**, not features:

- **Figma plugin** — push/pull brand-kit tokens via the live-sync API (the API already exists).
- **Public SDK / CLI** — wrap the token-sync + palette API for build pipelines (Style Dictionary adapter).
- **Community network effects** — lean into the shipped publish/follow/trends layer: featured collections, creator spotlights, embeds.

---

## Suggested execution order (highest leverage first)

1. **Phase 0** — clear R1 + R4; tag the release. *(Days.)*
2. **Phase 1** — R8, R10, observability, distributed limits. *(Week 1 post-launch.)*
3. **Phase 2.1–2.3** — shared `ui` kit + token scale + toasts + loading/empty states. *(The single biggest perceived-quality jump.)*
4. **Phase 2.4–2.6** — Studio IA, nav, hierarchy, type, forms, motion/responsive.
5. **Phase 3** — OIDC → SAML → SCIM.
6. **Phase 4 / 5** — ops maturity, then distribution.

---

## Scorecard deltas this roadmap targets

| Dimension | #5 | After Phase 0–1 | After Phase 2 | After Phase 3–5 |
|---|---:|---:|---:|---:|
| Security | 78 | ~86 | ~86 | ~90 |
| UX / Visual / CX | 86 | 86 | ~92 | ~93 |
| Enterprise | 78 | ~80 | ~80 | ~90 |
| Operational | 84 | ~88 | ~88 | ~92 |
| Launch Readiness | 80 | **clean GO** | — | — |

*The fastest path to an unconditional GO is Phase 0. The fastest path to "feels best-in-class" is Phase 2. The fastest path to enterprise revenue is Phase 3.*
