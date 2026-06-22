# Open Air — Application Testing, Verification & Audit Guide

*A professional QA / UAT / Product-Audit playbook. It describes exactly what an auditor should see, experience, and verify at every stage of the application, for every supported role and permission level.*

**Version:** 0.8.x · **Audience:** QA engineers, UAT testers, product auditors · **Scope:** UI, user journeys, workflows, permissions, and expected system behavior.

---

## How to use this guide

1. Work **role by role** (§4–§11). Each role section has: Starting Point → Dashboard → Journey → Feature Verification → Role Boundaries.
2. For every page, run the **UI/UX checklist** (§12).
3. Validate **subscriptions** (§13) and **administration** (§14).
4. Walk the **end-to-end scenarios** (§15).
5. Record findings in the **Auditor Checklist** (§16) with Pass/Fail, severity, notes, and screenshots.

Mark each item **PASS / FAIL / N-A** and classify failures: **Critical** (blocks use / security), **High** (major feature broken), **Medium** (degraded UX), **Low** (cosmetic).

---

## 1. The role model (read first)

Open Air's permission model maps to this guide's role list as follows. **"Team" and "Organization" are the same construct** in the product — an *organization* with members who hold a role. This guide treats them together and notes any distinction.

| Guide role | In the product |
|---|---|
| **Guest User** | Signed-out visitor |
| **Registered / Free User** | Signed-in account on the **Free** plan |
| **Pro User** | Signed-in account on the **Pro** plan (or legacy **Studio**) |
| **Team Member** / **Organization Member** | Org membership with role **member** |
| **Team Administrator** / **Organization Administrator** | Org membership with role **admin** or **owner** (owner = full lifecycle) |
| **System Administrator** | The **isolated** platform operator at `/sys` (not a normal user account) |

Plan → capability summary (authoritative source: `lib/plans.ts`, enforced server-side):

| Capability | Free | Pro | Studio (legacy) |
|---|---|---|---|
| Saved palettes | 5 | unlimited | unlimited |
| Collections | ✗ | ✓ | ✓ |
| Full Showroom · all exports | ✗ | ✓ | ✓ |
| Publishing to community | ✗ | ✓ | ✓ |
| Create a team | ✗ | ✓ (5 seats) | ✓ (25 seats) |
| Public API keys | ✗ | ✓ | ✓ |

---

## 2. Environment prerequisites (don't file intended "off" states as bugs)

| Feature under test | Requires | If missing |
|---|---|---|
| Gallery, Studio tools, linter, Showroom | nothing | always works |
| Sign-in, dashboard, teams, community, `/sys` | `DATABASE_URL`, `AUTH_SECRET`, a provider | sign-in disabled |
| Google sign-in | `AUTH_GOOGLE_ID/SECRET` | Google button absent |
| Magic link + all email (invites, receipts, notifications) | `AUTH_EMAIL_SERVER/FROM` | email logged, not sent |
| Billing / upgrade | `STRIPE_*` | checkout disabled |
| Real AI director | `GEMINI_API_KEY` | local keyword fallback |
| `/sys` console | `PLATFORM_BOOTSTRAP_*` or CLI admin | no admin to sign in as |
| Distributed rate limits | `UPSTASH_*` | per-instance fallback |

Confirm the target environment's configuration before testing, so a deliberately-disabled subsystem isn't logged as a defect.

---

## 3. Global UI conventions to expect everywhere

- **Header (≥768px):** logo → home; nav differs by auth state (see roles); right side = Sign in / Go Pro (guest) or plan chip + avatar menu (member).
- **Mobile (<768px):** a hamburger opens an accessible **drawer** (focus-trapped, Escape/backdrop closes, focus restored).
- **Feedback:** meaningful actions confirm via a single **toast** (bottom, auto-dismiss, screen-reader announced). Errors appear inline or as a toast.
- **Loading:** data-heavy routes show **skeletons** (no layout shift). Async buttons show a **spinner / pending label**.
- **Empty states:** lists with no data show a designed **EmptyState** (title + description + one action), not a bare sentence.
- **Footer:** nav, legal links, status, and a single **Contact: openair.mailer@gmail.com** line (no personal identity, no socials).

---
## 4. Guest User (signed out)

### 4.1 Starting point
- **Begins at** `/` — the marketing landing (signed-out home).
- **No onboarding.** No account state.
- **Navigation:** Gallery · Explore · Collections · Studio · Pricing · About + **Sign in** + **Go Pro**.
- **Default permissions:** read-only browse; all *actions* funnel to `/signin`.

### 4.2 Dashboard review
A guest has **no dashboard**. Visiting `/dashboard`, `/account`, `/orgs`, `/publish`, `/bookmarks`, or `/sys` must redirect to `/signin` (or 404 for `/sys`).

### 4.3 Complete user journey
| Step | Action | Expected | Should NOT happen |
|---|---|---|---|
| 1 | Load `/` | Marketing hero with rotating "Now Showing" palettes; CTA buttons | No console errors; no infinite refetch |
| 2 | Click **Gallery** | Catalog grid loads; scroll loads more | No layout jump; filters work |
| 3 | Apply filters (mood/industry/family/style/season) | Grid narrows | URL/state reflects filter |
| 4 | Open a palette `/p/<slug>` | Ramp, "why it works", contrast pairings, Showroom preview | — |
| 5 | Click **Save** / **Add to collection** | Redirect to `/signin` | No save occurs |
| 6 | Open `/explore` | Community feed (New/Top/Staff picks tabs) | Empty state if no data |
| 7 | Open `/studio` and any tool | Tool renders; works client-side | Nothing uploaded to a server (check Network for `/extract`) |
| 8 | Open `/pricing`, `/about`, `/legal`, `/status` | All render; legal operator = "Open Air", contact = mailer | No personal name/socials |

### 4.4 Feature verification (guest)
| Feature | Entry | Expected | Permission | Success | Failure |
|---|---|---|---|---|---|
| Browse catalog | `/gallery` | Filterable AA-gated grid | none | Palettes render, filters narrow | Blank grid / refetch loop |
| Palette detail | `/p/<slug>` | Ramp + rationale + contrast + Showroom | none | All sections present | Missing "why"/contrast |
| Studio tools | `/studio/*` | 14 tools, all client-side | none | Output updates live | Server round-trips / errors |
| Color linter | `/studio/lint` | Paste colors → score + rule report | none | Score + violations | No report |
| Pricing | `/pricing` | Free + Pro tiers, checkout CTA | none | Tiers shown | Studio shown as buyable |

### 4.5 Role boundaries
- **Accessible:** all read/browse + all Studio tools + linter + Showroom (preview).
- **Restricted:** save, collections, publish, follow, like, comment, teams, account, admin → all bounce to `/signin`.
- **Upgrade prompts:** "Go Pro" in header/landing (informational at this stage).

---

## 5. Registered / Free User

### 5.1 Starting point
- **Registers/sign in** at `/signin` (Google or email magic link).
- **First-ever sign-in** routes to **`/onboarding`** (2-step: pick a use-case → pick palettes), which seeds the dashboard, then lands on `/dashboard`.
- **After login:** `/` redirects into the gallery; nav switches to the **app set**: Gallery · Explore · Collections · Studio · Teams · Dashboard.
- **Avatar menu:** Dashboard · Saved palettes · Account & billing · Upgrade to Pro · Sign out. **No "Admin" item.**
- **Default permissions:** Free entitlements (5 saves, no collections/publish/teams).

### 5.2 Dashboard review (`/dashboard`)
Verify each section:
- **Header** — "Your dashboard / Welcome back, <name>".
- **Saved palettes** — heading with a compact **usage chip** ("X / 5 saved" + mini bar) to the right (content leads, not the billing meter). Empty → `EmptyState` ("No saved palettes yet" + "Browse the gallery").
- **Collections** — the `CollectionsManager` (create form + list). *Note: collections are a Pro feature; on Free the create may be gated/limited — verify the gate.*
- **Generated palettes** — appears only if the user generated any.
- **Picked for you** — a rail from the taste profile (only if there are saves).
- **Recently viewed** — a rail (only if cookies recorded views).

### 5.3 Complete user journey
| Step | Action | Expected | Should NOT happen |
|---|---|---|---|
| 1 | First sign-in | Routed to `/onboarding` | Skipping onboarding for a brand-new account |
| 2 | Complete onboarding | Lands on `/dashboard` with seeded saves + a "My picks" collection | Empty dashboard |
| 3 | Heart a palette | Toast "Saved to your library"; appears under Saved | Silent success |
| 4 | Reach 5 saves, save a 6th | Blocked with an upgrade nudge ("Free plan saves up to 5") | 6th save succeeds |
| 5 | Try **Add to collection** | Allowed/gated per plan; verify Pro-gate if applicable | — |
| 6 | Open `/publish` | **UpgradeCard** ("Publishing is a Pro feature") | Publish form shown |
| 7 | Open `/orgs` | **UpgradeCard** ("Teams") instead of create form | Team created |
| 8 | `/account` | Profile, **Creator profile** (handle/bio/website), data export, delete | — |
| 9 | Save profile | Toast "Profile saved" | Inline-only / silent |
| 10 | `/bookmarks` | Saved community palettes (empty state if none) | — |
| 11 | Sign out (avatar menu) | Returns to signed-out home | Session persists |

### 5.4 Feature verification (free)
| Feature | Entry | Expected | Permission | Success | Failure |
|---|---|---|---|---|---|
| Save palette | heart on any palette | Saved, counts toward 5 | Free | Toast + dashboard updates | No cap enforcement |
| Usage meter | dashboard Saved heading | "X / 5 saved" chip | Free | Accurate count | Wrong/over-count |
| Onboarding | first login | 2-step seeding | Free | Dashboard seeded | Loops / skips |
| Creator profile | `/account` | handle/bio/website | Free | Saves; `/u/<handle>` resolves | Bad URL accepted (must be http(s)) |
| Export (basic) | palette → Export | CSS/Tailwind free; advanced prompts upgrade | Free | Free formats work | Advanced unlocked |

### 5.5 Role boundaries
- **Accessible:** save (≤5), recently viewed, taste recs, creator profile, bookmarks, all Studio tools.
- **Restricted (Pro):** unlimited saves, collections, full Showroom, all exports, **publishing**, **team creation**, **API keys**.
- **Upgrade prompts:** the 6th-save nudge, `/publish` UpgradeCard, `/orgs` UpgradeCard, advanced export prompts, avatar-menu "Upgrade to Pro".

---

## 6. Pro User

### 6.1 Starting point
- Reaches Pro by completing **Stripe Checkout** from `/pricing` (test card `4242 4242 4242 4242`).
- Same app nav; the **plan chip** in the header reads **Pro**.

### 6.2 Dashboard review
As Free, plus: the usage chip reads **"Pro · unlimited saves"**; collections fully enabled; no upgrade nudges.

### 6.3 Complete user journey
| Step | Action | Expected |
|---|---|---|
| 1 | `/pricing` → **Go Pro** → Checkout | Returns as Pro; chip says Pro |
| 2 | Save >5 palettes | All succeed; no cap |
| 3 | Create a collection | Toast "Collection created"; appears in dashboard |
| 4 | Add palette to collection (CollectionPicker) | Toast "Added to collection"; count rises |
| 5 | `/publish` | **Publish form** (not UpgradeCard) |
| 6 | Publish a palette | Redirects to `/s/<slug>`; appears in `/explore` → New |
| 7 | `/account/api` | API keys section; create a key → toast; copy works |
| 8 | `/orgs` | **Create a team** form (entitled) |
| 9 | `/account` → Manage billing | Opens Stripe Billing Portal |

### 6.4 Feature verification (pro additions)
| Feature | Entry | Expected | Success | Failure |
|---|---|---|---|---|
| Unlimited saves | any palette | no cap | >5 saved | cap still applied |
| Collections | dashboard / palette | create, add, delete | toasts + counts | silent / errors |
| Publishing | `/publish` | full form, a11y score, license/visibility | publishes → `/s/<slug>` | UpgradeCard shown |
| Public API | `/account/api` | create/revoke keys | `GET /api/v1/palettes` with `Bearer` works | 401/403 with a valid key |
| Team creation | `/orgs` | create org as owner | lands on team page | UpgradeCard shown |
| Billing portal | `/account` | Stripe portal | manage/cancel | link dead |

### 6.5 Role boundaries
- **Accessible:** everything Free + collections, full Showroom, all exports, publishing, API, **teams (5 seats)**.
- **Restricted:** System Administrator (`/sys`) — a Pro user has **no** platform-admin access.
- **Org-only / team-only:** brand kits, proposals, domains, org audit — visible only inside a team you belong to (next sections).

---
## 7. Team Member / Organization Member (role: member)

### 7.1 Starting point
- Becomes a member by **accepting an email invite** (`/invite/<token>`) or via **verified-domain auto-join** (signing in with a matching company email).
- **Entry to the team:** `/orgs` lists their teams; clicking one opens `/orgs/<slug>`.
- **Default permissions:** view team, view brand kits, **propose** changes; **cannot** invite, change roles, edit kits directly, or see admin-only surfaces.

### 7.2 Dashboard / team view (`/orgs/<slug>`)
- **Header** — team name + a chip "You're the member".
- **Members** — list with roles (read-only for a member; no role selectors or remove buttons).
- **Brand kits** — a link to `/orgs/<slug>/kits`.
- **No** Invite section, Domains, Audit log, or Danger Zone (admin/owner-only).

### 7.3 Complete user journey
| Step | Action | Expected | Should NOT happen |
|---|---|---|---|
| 1 | Open invite link `/invite/<token>` | "Join <team>" with the offered role; **Accept** | Accept by a different email than invited → rejected |
| 2 | Accept | Joins; redirected to `/orgs/<slug>` | Token reusable after accept |
| 3 | Open a brand kit | Assets visible; **click-to-copy** hexes; lint score | Edit/Remove controls shown |
| 4 | Propose an addition | "Propose a color/palette" form → "Proposal submitted for review" | Direct add to kit |
| 5 | Propose a removal | per-asset "Propose removal" | Direct delete |
| 6 | Try `/orgs/<slug>/audit` or `/domains` | **404** (not a member-visible surface) | Page renders |
| 7 | Try to invite | No invite UI present | — |

### 7.4 Feature verification (member)
| Feature | Entry | Expected | Permission | Success | Failure |
|---|---|---|---|---|---|
| View team | `/orgs/<slug>` | members + kits, read-only | member | Renders | Admin controls visible |
| Brand kit (view) | `/orgs/<slug>/kits/<kit>` | assets + copy + lint | member | Copy works | Edit allowed |
| Propose change | kit detail | add/remove proposal | member | "submitted for review" + reviewer emailed | Applies directly |
| Audit / Domains | direct URL | 404 | — | 404 | 200 |

### 7.5 Role boundaries
- **Accessible:** view team, view/copy kits, submit proposals.
- **Restricted:** invite/remove members, role changes, kit edits, domains, audit, export, delete team.
- **Team-only:** brand kits, the propose→review loop (visible only to members).

---

## 8. Team / Organization Administrator (role: admin or owner)

> **owner** = the creator / full lifecycle (delete, role changes, transfer); **admin** = manage members/kits/invites but cannot remove an owner or change roles. The guide flags owner-only items.

### 8.1 Starting point
- An **owner** is the Pro user who created the team at `/orgs`. **admins** are promoted by an owner.
- **Entry:** `/orgs/<slug>`.
- **Permissions:** manage members & invites, create/edit brand kits, claim domains, view audit/export; **owner** adds role changes, plan/seat lifecycle, and team deletion.

### 8.2 Dashboard / team view (admin/owner)
Verify these sections (admin/owner only):
- **Members** — inline role selectors (owner only) + Remove.
- **Invite teammates** — email + role + **"X / N seats used"**; at the cap, the form is replaced by an upgrade prompt.
- **Pending invites** — list with **Revoke**.
- **Brand kits** — Create + manage; **Pending proposals** review queue inside each kit.
- **Verified domains** — claim/verify/auto-join/remove.
- **Audit log** — filterable; **Export CSV / JSON**.
- **Danger zone (owner only)** — **Export team data (JSON)** + **Delete team** (type-name-to-confirm).

### 8.3 Complete user journey
| Step | Action | Expected | Should NOT happen |
|---|---|---|---|
| 1 | Invite a teammate by email | Toast "Invite sent to …"; pending list updates; email sent (if SMTP) | Over-cap invite allowed |
| 2 | Fill to seat cap, invite one more | Blocked: "at seat limit" + upgrade link | 6th seat (Pro) added |
| 3 | Change a member's role (owner) | Toast "Role updated"; selector reflects it | Admin able to change roles |
| 4 | Demote/remove the **last owner** | Blocked ("must have at least one owner") | Allowed |
| 5 | Admin removes an owner | Blocked ("only an owner can remove an owner") | Allowed |
| 6 | Create a brand kit | Lands on kit; add color/palette | Member able to create |
| 7 | A member proposes a change | **Pending proposals** badge + queue appears | — |
| 8 | Approve a proposal | Change lands in the kit; proposer emailed; audit entry | Applies without record |
| 9 | Reject a proposal (with reason) | Kit unchanged; reviewer + reason recorded | — |
| 10 | Claim a domain `/domains` | TXT token shown; public providers (gmail) rejected | gmail.com accepted |
| 11 | Verify domain → enable auto-join | New `@domain` sign-ins auto-join (audit: `member.joined via domain`) | — |
| 12 | Audit log → Export CSV/JSON | File downloads (owner/admin only) | Member can export |
| 13 | **Danger zone** export (owner) | Full team JSON downloads | Admin (non-owner) sees it |
| 14 | **Delete team** (owner) | Requires exact team name; cascades; returns to `/orgs` | Deletes without confirm |

### 8.4 Feature verification (admin/owner)
| Feature | Entry | Expected | Permission | Success | Failure |
|---|---|---|---|---|---|
| Invite / seats | `/orgs/<slug>` | seat-capped invites | admin+ | within cap | over-cap allowed |
| Roles | members list | owner-only role change; last-owner protected | owner | correct gating | admin changes roles |
| Brand kits | `/kits` | create/edit/delete | admin+ | toasts + lint | member can edit |
| Review workflow | kit detail | approve/reject queue | admin+ | applies on approve | member can approve |
| Domains | `/domains` | claim/verify/auto-join | admin+ | JIT provisioning works | public domain claimable |
| Audit + export | `/audit` | filter + CSV/JSON | admin+ | downloads | member access |
| Team export / delete | Danger zone | export + type-to-confirm delete | **owner** | cascade complete | no confirm / admin access |

### 8.5 Role boundaries
- **admin:** members, invites, kits, proposals review, domains, audit/export.
- **owner adds:** role changes, last-owner protection authority, team **export & deletion**.
- **Org-only functionality:** everything in §7–§8 lives inside a team; a non-member hitting these URLs gets **404** (the team is cloaked).

---
## 9. System Administrator (the platform operator)

> **Critical to verify:** this is a **separate authentication domain**, not a normal user with a flag. It is unreachable from the app nav, and no application account — however privileged — has access.

### 9.1 Starting point
- **Begins at** `/sys/login` (clean console login, no site chrome, "authorized personnel only").
- **First admin** is created via `PLATFORM_BOOTSTRAP_*` env or `npm run platform:admin -- create <email> "<name>"`.
- After login, a bootstrap/reset password forces a change at `/sys/password`; **2FA enrollment is mandatory** before the console is usable.
- **Permissions:** total platform control — admins, users, billing oversight, moderation, audit, flags, settings, security.

### 9.2 Console review (navigation + each section)
Left nav: Dashboard · Administrators · Users · Billing · Moderation · Audit log · Feature flags · Settings · Security. Topbar shows the signed-in admin + role chip + Sign out + "Exit to site".

| Section | Route | Verify |
|---|---|---|
| **Dashboard** | `/sys` | KPIs (users, saves, admins, open reports), system health checks, plan mix, recent activity feed |
| **Administrators** | `/sys/admins` | list (last-login, status); **create** admin; **disable/enable**; **reset password**; **last active admin can't be disabled** |
| **Users** | `/sys/users` | search by email/name; per-user **plan override** (free/pro/studio) |
| **Billing** | `/sys/billing` | paying customers, plan mix, est. MRR, conversion, Stripe configured/not |
| **Moderation** | `/sys/community` | **open reports** (Dismiss / Remove palette); **staff-pick** feature/unfeature |
| **Audit log** | `/sys/audit` | every privileged action; filter by action |
| **Feature flags** | `/sys/flags` | create/enable/disable/delete a flag |
| **Settings** | `/sys/settings` | set/delete JSON key/values (e.g. `require_2fa`) |
| **Security** | `/sys/security` | 2FA enrol/disable + backup codes; **active sessions** (revoke / revoke-all) |

### 9.3 Complete user journey
| Step | Action | Expected | Should NOT happen |
|---|---|---|---|
| 1 | Visit `/sys` while logged out | Redirect to `/sys/login` (no content leak) | Console renders |
| 2 | Wrong password ×many | Rate-limited / locked ("too many attempts") | Unlimited attempts |
| 3 | Correct password (bootstrap) | Forced to `/sys/password`, then 2FA enrol | Console access without 2FA |
| 4 | Enrol 2FA | Secret + otpauth URI; confirm with a code → **10 backup codes shown once** | Codes shown again on refresh forever |
| 5 | Sign out, sign back in | Password → **6-digit code** step; valid code or backup code completes | Skips second factor |
| 6 | Wrong TOTP code | Rejected; rate-limited | Accepted |
| 7 | Create another admin | New admin (must-change-password) | Duplicate email allowed |
| 8 | Disable the only other admin / yourself as last | Blocked ("last active administrator") | Allowed |
| 9 | Override a user's plan | `/sys/users` → Apply; user's plan changes; **audit entry** | No record |
| 10 | Toggle a feature flag | State flips; audit entry | — |
| 11 | Moderate a report | Dismiss or Remove palette; audit entry; report clears | — |
| 12 | Feature a palette | Appears in `/explore` → Staff picks | — |
| 13 | Check `/sys/audit` | Sees login, 2FA enable, plan override, flag toggle, moderation | Actions missing |
| 14 | Revoke a session (Security) | That session can no longer resolve | — |
| 15 | Sign out | `/sys` gated again | Session persists |

### 9.4 Administrative verification — System Administrator
- **User management** — search, view, **plan override** (comp/correct). Confirm the override reflects on the user's account and is audit-logged.
- **Organization management** — teams are governed by their owners; the platform admin oversees via **moderation** (content) and **users** (plan). *Note: there is no per-org God-mode edit screen by design; org control is owner-driven and platform oversight is moderation + plan.*
- **Subscription management** — `/sys/billing` (read: mix, MRR, Stripe status) + plan override in Users for comping.
- **Content moderation** — `/sys/community`: triage reports (dismiss / remove), curate staff picks.
- **Analytics** — `/sys` KPIs + health; product analytics via PostHog (if configured) outside the console.
- **Audit logs** — `/sys/audit`, append-only, filterable; every console write appears.
- **Security controls** — `/sys/security`: 2FA, backup codes, session revoke/revoke-all; mandatory-2FA policy via `require_2fa` setting.
- **System settings** — `/sys/settings`: global JSON config; **feature flags** at `/sys/flags`.

### 9.5 Role boundaries
- **Accessible:** the entire `/sys` console.
- **Restricted from everyone else:** no application account reaches `/sys`; `/admin` redirects to `/sys`; `/sys` is `noindex` and gated.
- **Admin-only functionality:** create/disable admins, plan overrides, moderation takedowns, feature flags, platform settings, session revocation.

---
## 10. UI/UX verification checklist (run on every page)

For **each** page below, verify the row dimensions. Mark PASS/FAIL per cell.

### 10.1 Per-page dimensions

| Dimension | What to confirm |
|---|---|
| **Layout consistency** | Consistent spacing, one card radius (`rounded-card`), one button style, aligned headers |
| **Responsiveness** | Reflows at 1440 / 768 / 375px; no horizontal scroll except intended tables; mobile drawer works |
| **Accessibility** | Keyboard-only nav reaches every control; visible focus ring; labels on all fields; `aria-live` toast announced; reduced-motion respected; AA contrast |
| **Loading states** | Skeleton on first load (data routes); async buttons show spinner/pending; no layout shift |
| **Empty states** | `EmptyState` (title + description + action), not a bare sentence |
| **Error handling** | Invalid input → inline error; failed request → toast/error; a thrown error shows the error page; a bad URL shows not-found |
| **Search behavior** | Where present (gallery, `/sys/users`): query narrows results; empty query resets; no-results state |
| **Filtering** | Gallery filters (mood/industry/family/style/season) narrow; combine correctly; clearable |
| **Sorting** | Explore tabs (New/Top/Staff picks) reorder; Audit newest-first |
| **Modal/overlay** | Avatar menu, report dropdown, mobile drawer: open/close, Escape, outside-click, focus management |
| **Form validation** | Required fields enforced; bad hex rejected; bad URL rejected; type-to-confirm gates (delete) |
| **Notifications** | Success/error toasts appear, auto-dismiss, are announced; no silent successes |

### 10.2 Page coverage matrix (tick each page × dimension in §16)

Public: `/` · `/gallery` · `/c` · `/c/[slug]` · `/p/[slug]` · `/explore` · `/s/[slug]` · `/u/[handle]` · `/trends` · `/studio` · `/studio/*` (14 tools) · `/pricing` · `/about` · `/legal` · `/legal/[slug]` · `/status` · `/signin`

Member: `/dashboard` · `/onboarding` · `/account` · `/account/api` · `/bookmarks` · `/publish`

Teams: `/orgs` · `/orgs/[slug]` · `/orgs/[slug]/kits` · `/orgs/[slug]/kits/[kit]` · `/orgs/[slug]/domains` · `/orgs/[slug]/audit` · `/invite/[token]`

Admin: `/sys/login` · `/sys` · `/sys/admins` · `/sys/users` · `/sys/billing` · `/sys/community` · `/sys/audit` · `/sys/flags` · `/sys/settings` · `/sys/security` · `/sys/password`

### 10.3 Specific UI expectations to spot-check
- **Mobile drawer:** hamburger <768px; focus-trapped; Escape + backdrop close; focus returns to the trigger.
- **Toasts:** bottom, one visual style, auto-dismiss ~3s, `aria-live="polite"`.
- **Copy actions:** "Copied" feedback; visible & tappable on **touch** (not hover-only).
- **Buttons:** primary `<Button>` consistent; async buttons spin; destructive uses the danger style + a confirm.
- **No personal identity** anywhere — only "Open Air" and `openair.mailer@gmail.com`.

---

## 11. Subscription verification

### 11.1 Free plan
| Verify | Expected |
|---|---|
| Saves | capped at 5; 6th blocked with nudge |
| Collections | gated (Pro) |
| Publishing | `/publish` → UpgradeCard |
| Teams | `/orgs` → UpgradeCard |
| Exports | basic only; advanced prompts upgrade |
| API | `/account/api` not available |

### 11.2 Pro plan
| Verify | Expected |
|---|---|
| Upgrade flow | `/pricing` → Go Pro → Checkout (`4242…`) → returns Pro; chip = Pro; receipt email (if SMTP) |
| Unlocks | unlimited saves, collections, full Showroom, all exports, publishing, API, **teams (5 seats)** |
| Billing management | `/account` → Manage billing → Stripe portal |
| Cancellation | via portal → access persists until period end |

### 11.3 Team plan (Pro entitlement: `teams`, 5 seats)
| Verify | Expected |
|---|---|
| Create team | only Pro/Studio can create (`/orgs`) |
| Seats | members + pending invites capped at 5 (Pro); 6th invite blocked |
| Shared resources | brand kits, proposals, domains, audit available to the team |
| Billing | tied to the **owner's** plan; downgrade leaves the over-limit team intact (no new invites) — verify the prompt |

### 11.4 Organization plan (Studio legacy: 25 seats)
| Verify | Expected |
|---|---|
| Seats | up to 25 (`ownerSeatLimit` from the owner's plan) |
| Everything in §11.3 | applies at the larger seat cap |

### 11.5 Downgrade / cancellation behavior
| Scenario | Expected |
|---|---|
| Pro → Free (cancel) | access persists to period end; then entitlements revert (publish/teams/collections re-gate) |
| Over-seat after downgrade | team persists; new invites blocked with an "over seat limit / upgrade" prompt; existing members retained |
| Admin plan override (`/sys/users`) | takes effect server-side immediately; audit-logged |

---
## 12. Administrative verification (consolidated)

| Layer | Surface | Verify (detail in §) |
|---|---|---|
| **System Administrator** | `/sys/*` | user mgmt, plan overrides, billing oversight, moderation, analytics/KPIs, audit, security (2FA/sessions), feature flags, settings — §9 |
| **Organization Administrator** | `/orgs/<slug>` | member mgmt, role assignment (owner), shared brand kits, billing tie (owner plan/seats), org settings (rename), domains, audit/export, delete (owner) — §8 |
| **Team Administrator** | `/orgs/<slug>` | team creation (as owner), invitations, permissions (member vs admin vs owner), collaboration (brand kits + review workflow) — §8 |

**Cross-checks the auditor must confirm:**
- A platform admin action that touches a user (plan override) appears in **`/sys/audit`**.
- An org admin action (invite, role, kit, proposal, domain) appears in **`/orgs/<slug>/audit`** and exports cleanly.
- Privilege escalation is **not** possible: a member cannot reach admin URLs (404); an app user cannot reach `/sys`; an admin cannot remove an owner.

---

## 13. End-to-end audit scenarios

Run each as a continuous flow; note where it breaks.

### S1 — New user → first successful task
1. Sign up at `/signin` → complete `/onboarding` → land on `/dashboard` (seeded).
2. Open a palette, **Save** it (toast), confirm under Saved.
3. **Expected outcome:** a brand-new account reaches a designed dashboard and completes a save with confirmation — no dead ends, no silent steps.

### S2 — User upgrades to Pro
1. `/pricing` → **Go Pro** → Checkout `4242…` → return as Pro.
2. Create a collection; publish a palette; create an API key.
3. **Expected:** all three previously-gated actions now succeed; chip reads Pro; receipt email (if SMTP).

### S3 — User joins a team
1. As an owner, invite `teammate@co.com`. As that teammate, open `/invite/<token>` → **Accept**.
2. **Expected:** joins as member; appears in the team's Members; audit logs `member.joined`; cannot see admin surfaces.

### S4 — Team collaboration (propose → review → approve)
1. Member opens a brand kit → **Propose** an addition.
2. Owner/admin sees the **Pending proposals** queue → **Approve**.
3. **Expected:** the color lands in the kit; proposer emailed; audit logs `proposal.created` then `proposal.approved`; kit lint score updates.

### S5 — Organization onboarding via domain
1. Admin claims + verifies `co.com`, enables auto-join.
2. A new user signs in with `new@co.com`.
3. **Expected:** auto-seated into the team as member; audit logs `member.joined (via: domain)`; no invite needed.

### S6 — Live token sync (integration)
1. Admin enables **Live Sync** on a kit; copies the DTCG URL.
2. `GET /api/v1/kits/<id>/tokens?format=css&token=…` → CSS variables; repeat with `If-None-Match` → **304**.
3. Rotate the token → old URL returns **401**.

### S7 — Administrator management workflow
1. Sign in to `/sys` (with 2FA). Override a user's plan; toggle a feature flag; remove a reported palette; feature a staff pick.
2. **Expected:** each action takes effect and appears in `/sys/audit`; revoking a session ends it.

### S8 — Lifecycle / offboarding
1. Owner exports team data (Danger Zone JSON); then **deletes** the team (type-to-confirm).
2. **Expected:** export is complete; deletion cascades; team disappears from `/orgs`; member can no longer access it.

---

## 14. Final auditor checklist & sign-off

> Duplicate this table per area as needed. **Status:** PASS / FAIL / N-A. **Severity** (failures only): Critical / High / Medium / Low.

### 14.1 Coverage checklist

| # | Area / Item | Role | Status | Severity | Notes | Screenshot? |
|---|---|---|---|---|---|---|
| 1 | Guest browse + actions bounce to sign-in | Guest | ☐ | | | ☐ |
| 2 | Studio tools (14) + linter render & compute client-side | Guest | ☐ | | | ☐ |
| 3 | Onboarding seeds a new account | Free | ☐ | | | ☐ |
| 4 | Save cap (5) + 6th blocked | Free | ☐ | | | ☐ |
| 5 | Publish/Teams show UpgradeCard | Free | ☐ | | | ☐ |
| 6 | Creator profile rejects non-http(s) URL | Free | ☐ | | | ☐ |
| 7 | Upgrade → Pro unlocks saves/collections/publish/API/teams | Pro | ☐ | | | ☐ |
| 8 | Billing portal opens; cancel keeps access to period end | Pro | ☐ | | | ☐ |
| 9 | Invite accept bound to invited email | Member | ☐ | | | ☐ |
| 10 | Member can propose but not edit; admin URLs 404 | Member | ☐ | | | ☐ |
| 11 | Seat cap enforced on invite | Team Admin | ☐ | | | ☐ |
| 12 | Owner-only role change; last-owner protected | Team Admin | ☐ | | | ☐ |
| 13 | Proposal approve applies + notifies + audits | Team Admin | ☐ | | | ☐ |
| 14 | Domain claim rejects public providers; auto-join works | Org Admin | ☐ | | | ☐ |
| 15 | Audit export (CSV/JSON) owner/admin only | Org Admin | ☐ | | | ☐ |
| 16 | Team data export + delete (type-to-confirm) | Owner | ☐ | | | ☐ |
| 17 | `/sys` gated; no app account reaches it | SysAdmin | ☐ | | | ☐ |
| 18 | Login rate-limited; 2FA mandatory; backup codes shown once | SysAdmin | ☐ | | | ☐ |
| 19 | Plan override / flag / moderation all audit-logged | SysAdmin | ☐ | | | ☐ |
| 20 | Session revoke ends a session | SysAdmin | ☐ | | | ☐ |
| 21 | Mobile drawer: focus-trap, Escape, restore | All | ☐ | | | ☐ |
| 22 | Toasts announce every mutation (no silent success) | All | ☐ | | | ☐ |
| 23 | Skeletons on data routes; EmptyState on empty lists | All | ☐ | | | ☐ |
| 24 | Copy actions visible/tappable on touch | All | ☐ | | | ☐ |
| 25 | No personal identity; contact = openair.mailer@gmail.com | All | ☐ | | | ☐ |

### 14.2 Per-page UI/UX matrix (replicate §10.1 dimensions for each page in §10.2)

| Page | Layout | Responsive | A11y | Loading | Empty | Errors | Forms | Notifs | Status | Severity | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/dashboard` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | | | |
| `/orgs/[slug]` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | | | |
| `/sys` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | | | |
| *(add a row per page in §10.2)* | | | | | | | | | | | |

### 14.3 Severity definitions
- **Critical** — blocks a core journey, exposes a security/permission hole, or causes data loss (e.g. a member can edit a kit; `/sys` reachable by an app user; cross-tenant data visible).
- **High** — a major feature is broken or a role boundary leaks (e.g. seat cap not enforced; proposal approval doesn't apply).
- **Medium** — degraded UX (e.g. missing skeleton, silent success, missing empty state).
- **Low** — cosmetic (spacing, copy, minor inconsistency).

### 14.4 Screenshots required
Attach screenshots for: each role's dashboard, every failure, the upgrade flow, the team review queue, the `/sys` console (dashboard + security), the mobile drawer, and any visual inconsistency.

### 14.5 Recommendations

> Summarize findings, ranked by severity, with a recommended fix and owner for each. Note any environment-driven "off" states (§2) explicitly so they aren't mistaken for defects.

| # | Finding | Severity | Recommendation | Owner |
|---|---|---|---|---|
| | | | | |

### 14.6 Sign-off

| Field | Value |
|---|---|
| Auditor | |
| Date | |
| Build / commit | |
| Environment | |
| Overall verdict | ☐ Pass ☐ Pass with conditions ☐ Fail |
| Critical issues | |

---

*Related: [TESTING-GUIDE.md](../TESTING-GUIDE.md) (quick walkthrough) · [docs/security.md](./security.md) · [docs/authentication.md](./authentication.md) · [docs/billing.md](./billing.md) · operator: Open Air · openair.mailer@gmail.com.*
