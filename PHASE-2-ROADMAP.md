# Open Air — Phase 2: UX/UI Refinement Program

*Detailed execution roadmap for the design-study work. Thesis (from the study): the foundation is premium; what's missing is the **connective layer** — a shared component kit, a token scale, and consistent feedback. No new features — refinement only. Each sub-phase lists concrete tasks, status, acceptance criteria, and dependencies.*

**Legend:** ✅ done · 🔄 in progress · ◻ not started

---

## Status snapshot

| Commit | What landed |
|---|---|
| `1269db8` | Token scale (`radius-control/card/pill`, `shadow-overlay`, `ease-standard` + durations) + `components/ui` kit (Button, Card/SectionCard, Badge/PlanBadge, Input/Select/Textarea/Field, ErrorNote, Stat); `platform/ui` consolidated onto it |
| `ab6324c` | Team & community forms migrated to the kit (CreateOrgForm, InviteForm, ProfileForm, PublishForm) + accessible labels; like/bookmark/follow/copy buttons on the radius tokens |

**Overall Phase 2 progress: ~25%** (2.1 foundation done; consumer migration underway).

---

## 2.1 — Foundation & consistency *(do first; everything else depends on it)*

> **Why first:** once the kit + token scale exist, every later sub-phase is a refactor *onto* them rather than net-new styling.

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1.1 | Radius scale (`control`/`card`/`pill`) in `@theme` | ✅ | replaces 7 ad-hoc radii |
| 2.1.2 | Shadow + motion tokens (`shadow-overlay`, `ease-standard`, durations) | ✅ | app stays border-based; shadow for overlays only |
| 2.1.3 | Shared `components/ui` kit | ✅ | Button, Card/SectionCard, Badge/PlanBadge, Input/Select/Textarea/Field, ErrorNote, Stat, EmptyState, CopyButton |
| 2.1.4 | Delete duplicate PlanBadge + retired `studio` styling | ✅ | `platform/ui` now re-exports the kit |
| 2.1.5 | Migrate **team & community forms** | ✅ | `ab6324c` |
| 2.1.6 | Migrate **Studio tool components** | ◻ | generator, gradients, extract, scales, tokens, lint, etc. — buttons/inputs/sliders/result cards |
| 2.1.7 | Migrate **account + dashboard** surfaces | ◻ | CollectionsManager, DeleteAccount, ApiKeys, usage/saved cards |
| 2.1.8 | Migrate **chrome + auth** | ◻ | AuthNav inline plan badge → `PlanBadge`; header/landing buttons → `Button` |
| 2.1.9 | Migrate **server-action page forms** | ◻ | `/orgs/[slug]/kits`, `/domains`, `/sys/*` raw `<input>/<button>` → kit |
| 2.1.10 | Radius sweep to the 3-token target | 🔄 | grep remaining `rounded-2xl`/`rounded-xl`/`rounded-lg` → `rounded-card`/`rounded-control`; **target: 3 radii in use, not 7** |

**Acceptance:** one `Button` pattern across the app; one card radius; `grep -r "rounded-\(2xl\|xl\|lg\|md\|sm\)"` returns only intentional exceptions; no duplicate primitives.

**Effort remaining:** ~1–1.5 days (mechanical, surface-by-surface, verify after each batch).

---

## 2.2 — Action feedback *(highest perceived-quality gain)*

> The whole app has **1 toast + 1 `aria-live` region**. Successful actions are silent — the clearest "unfinished" signal.

| # | Task | Status |
|---|---|---|
| 2.2.1 | Build one `Toaster` provider + `useToast()` (single style, auto-dismiss, `aria-live="polite"`) | ◻ |
| 2.2.2 | Mount it once in `app/layout.tsx` | ◻ |
| 2.2.3 | Route **every** action result through it — save, create/delete collection, invite, role change, remove member, publish, like, bookmark, copy, sync rotate, profile save | ◻ |
| 2.2.4 | Remove scattered inline `text-xs` success messages (keep inline only for field validation) | ◻ |
| 2.2.5 | Standardize copy ("Saved to your library", "Invite sent to …", "Copied", "Link rotated") | ◻ |

**Acceptance:** every meaningful mutation produces a brief, consistent confirmation (or error) toast; screen readers announce it; no silent successes.

**Effort:** ~1 day. **Depends on:** 2.1 (uses kit tokens/colors).

---

## 2.3 — Loading & empty states

> One `loading.tsx`, zero `Suspense`, skeletons in 3 files. Authenticated data surfaces "pop in."

| # | Task | Status |
|---|---|---|
| 2.3.1 | Route-level `loading.tsx` skeletons matching final layout: dashboard, `/orgs`, `/orgs/[slug]`, account, `/explore`, `/bookmarks` | ◻ |
| 2.3.2 | Async buttons get a consistent pending state via `Button` (disabled + label/spinner) | ◻ |
| 2.3.3 | Adopt `EmptyState` everywhere: dashboard sections, collections, `/orgs`, bookmarks, published grids, audit log, no-search-results | ◻ |
| 2.3.4 | Design the **first-session dashboard** intentionally (the emotional make-or-break screen) | ◻ |

**Acceptance:** no layout shift on load for data surfaces; every empty list uses `EmptyState` with one clear action; a brand-new account sees a designed dashboard, not bare text.

**Effort:** ~1–1.5 days.

---

## 2.4 — Information architecture & clutter *(Studio especially)*

> The Studio hub is the most cluttered screen: 14 flat, equally-weighted, jargon-blurbed tiles + a muddled "Showroom" identity. Two built surfaces (`/trends`, `/bookmarks`) are in no nav.

| # | Task | Status |
|---|---|---|
| 2.4.1 | Group the 14 Studio tools into **Create / Systematize / Validate / Data-viz** with a one-line category intro | ◻ |
| 2.4.2 | Rewrite tool blurbs in plain language (no "CVD/glare scorecard", "P3 headroom") | ◻ |
| 2.4.3 | Separate the **Showroom** from the tool directory — distinct sections, one page identity, one primary action | ◻ |
| 2.4.4 | Reconcile nav: keep primary surfaces consistent signed-in vs out (restore **Collections** to `APP_NAV`) | ◻ |
| 2.4.5 | Surface **Trends + Bookmarks** as tabs under **Explore** (feature-free fix) | ◻ |

**Acceptance:** Studio scannable in <5s with categories; no orphaned routes; nav parity across auth states.

**Effort:** ~1 day. **No features removed** — organization only.

---

## 2.5 — Hierarchy, type & forms *(per-surface polish)*

| # | Task | Status |
|---|---|---|
| 2.5.1 | **Dashboard:** demote `UsageMeter` to a slim indicator near "Saved"; lead with the user's content | ◻ |
| 2.5.2 | Unify palette presentation on one `PaletteCard` + consistent grid/rail rhythm (Saved/Generated/Picked/Recent) | ◻ |
| 2.5.3 | **Type audit:** promote the ~275 `text-xs` body/helper/label/interactive uses to `text-sm`; reserve `text-xs` for chrome (timestamps, counts, badges) | ◻ |
| 2.5.4 | Apply heading sizes consistently (page titles `text-4xl`; kill `2xl`/`5xl` drift for equal levels) | ◻ |
| 2.5.5 | **Forms:** every field gets a visible/visually-hidden `<label>` | 🔄 | team/community forms done in `ab6324c`; remaining: studio, account, kit/domain page forms |
| 2.5.6 | Standardize all controls via `Input`/`Select` (one radius, keep `focus:border-text`) | 🔄 | continues with 2.1.6–2.1.9 |

**Acceptance:** dashboard leads with content; one palette-card language; no body/interactive text below 14px; every input has an accessible name.

**Effort:** ~1.5 days.

---

## 2.6 — Motion & responsive finish

| # | Task | Status |
|---|---|---|
| 2.6.1 | Motion tokens defined (`ease-standard`, durations) | ✅ (`1269db8`) |
| 2.6.2 | Apply tokens to hovers, menus, the toast (consistent easing/duration) | ◻ |
| 2.6.3 | Restrained feedback motion on key moments (save, copy) — inside the existing reduced-motion guard | ◻ |
| 2.6.4 | Verify Studio tools (sliders, canvases, contrast matrix, Showroom) on real phone widths | ◻ |
| 2.6.5 | Consider card layouts instead of horizontal-scroll tables (members/audit) on mobile | ◻ |
| 2.6.6 | *(Optional, borderline-feature)* manual light/dark/system toggle — one control + a class on `<html>` | ◻ |

**Acceptance:** consistent motion language; no janky/oversized Studio controls on phones; (optional) user-controllable theme.

**Effort:** ~1 day.

---

## Execution order & dependencies

```
2.1 Foundation ──┬──► 2.2 Feedback (toasts)
   (kit+tokens)  ├──► 2.3 Loading/Empty
                 ├──► 2.5 Hierarchy/Type/Forms
                 └──► 2.6 Motion/Responsive
2.4 IA/Clutter ── independent (can run in parallel)
```

**Recommended sequence:**
1. **Finish 2.1** (consumer migration + radius sweep) — unblocks everything.
2. **2.2 Feedback** — biggest perceived-quality jump for the least code.
3. **2.3 Loading/Empty** — kills "pop-in" and bare screens.
4. **2.4 IA** — de-clutter Studio, fix nav (parallelizable).
5. **2.5 Hierarchy/Type/Forms** then **2.6 Motion/Responsive** — final polish.

---

## Definition of done for Phase 2

- [ ] 3 radii in use (not 7); one `Button`; no duplicate primitives.
- [ ] Every meaningful action confirms via a single, accessible toast.
- [ ] Every data surface has a route skeleton; every empty list uses `EmptyState`.
- [ ] Studio hub categorized + de-jargoned; nav consistent; no orphan routes.
- [ ] Dashboard leads with content; no sub-14px body/interactive text; every field labelled.
- [ ] Consistent motion language; Studio usable on phones.

**Total remaining effort:** ~6–7 focused days. **Target scorecard delta:** UX/Visual/CX **86 → ~92**, Accessibility **89 → ~92**, with no functional change.

---

## How we'll work it

Surface-by-surface batches (the established rhythm): migrate → `tsc` + `eslint` + tests green → sync → commit. Each batch is independently shippable, so the pipeline stays green throughout and you can review incrementally. Current position: **mid-2.1** (next batch: Studio components + dashboard + AuthNav badge + radius sweep).
