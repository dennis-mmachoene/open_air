# Open Air — Interface Testing & Verification Guide

*A persona-by-persona walkthrough for auditing the live application from the UI. Work top to bottom: each section says **where to start**, **what to do**, and **what to expect**. Tick the boxes; log anything that fails using the report template in §11.*

> **Scope.** This covers everything shipped through Wave 8: the public catalog, Studio tools, accounts, billing, community, teams & governance, and the isolated System Administrator console. Routes that depend on env/config are flagged so you don't report an intentionally-off feature as a bug (see §10).

---

## 1. Before you start — environment & accounts

You'll want these ready. The app **boots and browses with zero config** (static catalog), but accounts, billing, AI, teams, and admin need credentials.

| To test… | You need |
|---|---|
| Browse, Studio tools, linter | nothing |
| Sign in, save, dashboard, teams, community | `DATABASE_URL`, `AUTH_SECRET`, a provider (Google and/or email) |
| Google sign-in | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` |
| Email magic-link + all transactional email | `AUTH_EMAIL_SERVER` / `AUTH_EMAIL_FROM` |
| Billing / Pro upgrade | `STRIPE_*` (test mode) |
| AI director (real, not fallback) | `GEMINI_API_KEY` |
| System Administrator console | `PLATFORM_BOOTSTRAP_EMAIL` + `PLATFORM_BOOTSTRAP_PASSWORD` **or** the CLI seed |
| Domain auto-join, invites by email | SMTP configured (above) |

**Accounts to prepare for a full pass (use real or alias inboxes):**

- **A — Free user** (any personal email).
- **B — Pro user / Team owner** (will upgrade to Pro; will own a team). Use a **company-style domain** you control, e.g. `you@acmeco.com`, so you can test domain auto-join.
- **C — Team member** (second email, ideally on the same company domain as B, e.g. `teammate@acmeco.com`).
- **D — Community creator** (can be the same as A or B).
- **SysAdmin** — a platform admin identity, created via env bootstrap or `npm run platform:admin -- create you@example.com "Your Name"`. **This is separate from all of the above** — it is not a normal app account.

**Migrations:** make sure the DB is current — `npm run db:migrate` (migrations `0000`–`0014`).

---

## 2. The mental model (so the UI makes sense)

Open Air has three pillars and one separate operations plane:

- **System** — *create*: the **Studio** (generate, scales, tokens, gradients, linter, …) and the **Showroom** (any palette re-themes a whole UI).
- **Guarantee** — *trust*: accessibility/contrast, color-blindness stress, gamut/print, and the **linter** everywhere.
- **Govern** — *collaborate*: **Community** (publish, explore, follow, comment) and **Teams** (orgs, roles, brand kits, review workflow, domains, audit).
- **Platform operations** — the **System Administrator** at `/sys`: a self-contained console with its own login, 2FA, and audit. **Not** a normal user with a flag.

The home page is smart: signed-out → marketing landing; signed-in → the gallery.

---

## 3. Persona: Guest / Visitor (signed out)

**Start at:** `/` (the landing).

- [ ] Landing shows the marketing hero with rotating "Now Showing" palettes.
- [ ] Top nav shows **Gallery · Explore · Collections · Studio · Pricing · About** + **Sign in** + **Go Pro**.
- [ ] **Footer** shows a single quiet line: **Contact openair.mailer@gmail.com** (no personal name, no social links).
- [ ] `/gallery` loads palettes; scrolling loads more (no console errors, no infinite refetch).
- [ ] Filters (mood / industry / family / style / season) narrow the grid.
- [ ] Open any palette `/p/...`: ramp, "why it works", contrast pairings, and the Showroom render.
- [ ] On a palette, **Save** / **Add to collection** redirect a guest to `/signin`.
- [ ] `/explore` shows the community feed with **New / Top / Staff picks** tabs (may be empty on a fresh DB).
- [ ] `/pricing`, `/about`, `/legal`, `/status` all render. `/about` and `/legal` contact = **openair.mailer@gmail.com**; legal byline = "Open Air" (no individual named).

**Expect:** everything read-only works without an account. Any *action* (save, publish, follow, like) bounces to sign-in.

---

## 4. Persona: Studio user (no account needed)

**Start at:** `/studio` — the tools row links every tool.

Each tool is client-side (instant; nothing uploaded to a server). Verify each opens and produces output:

- [ ] **AI director** (`/studio/ai`) — a brief → a system (real AI if `GEMINI_API_KEY` set, else keyword fallback).
- [ ] **Tonal scales** (`/studio/scales`) — one color → 50–950, each row shows hex + ratio + AA/AAA.
- [ ] **Semantic tokens** (`/studio/tokens`) — brand color → token groups + contrast matrix; light/dark toggle.
- [ ] **Stress test** (`/studio/stress`) — CVD / low-light / glare scorecard.
- [ ] **Gamut & print** (`/studio/output`) — P3 headroom + CMYK estimate.
- [ ] **Data-viz palettes** (`/studio/dataviz`) — colorblind-safe categorical/sequential/diverging.
- [ ] **Gradient a11y** (`/studio/gradient-check`) — readable-text regions.
- [ ] **Elevation** (`/studio/elevation`) — tinted shadow system.
- [ ] **Repair a chart** (`/studio/viz-repair`) — fixes colorblind conflicts.
- [ ] **Color linter** (`/studio/lint`) — **paste colors → a 0–100 lint score + a rule-by-rule report.**
- [ ] **Generator / Extract / Gradients / Make accessible** — generate, pull-from-image, gradient studio, AA repair.

**Linter spot-check (`/studio/lint`):** paste `#1d4ed8, #1e4fd9, #f59e0b, #808080, #f8fafc`.
- [ ] Reports a **near-duplicate** (the two blues), and an **info** note on the mid-grey (no AAA text). Score drops below 100. Errors only for invalid hex.

---

## 5. Persona: Free user

**Start at:** `/signin` → sign in as **A**. First-ever sign-in routes to **`/onboarding`**.

- [ ] **Onboarding:** pick a use-case → pick palettes → land on `/dashboard` with those seeded.
- [ ] After login, `/` redirects into the gallery; nav switches to **Gallery · Explore · Studio · Teams · Dashboard** + avatar menu.
- [ ] **Avatar menu** lists: Dashboard · **Saved palettes** · Account & billing · Upgrade to Pro · Sign out. (No "Admin" item — that's gone by design.)
- [ ] **Save** a palette (heart) → appears under Saved on `/dashboard`.
- [ ] **Usage meter** shows `X / 5`. The **6th save is blocked** with an upgrade nudge.
- [ ] **Collections / advanced exports / publishing / team creation** prompt **Upgrade to Pro**.
- [ ] `/bookmarks` exists (saved community palettes — empty until you save some in §7).
- [ ] `/account` → **Creator profile** section (handle, bio, website) and data export / delete.

**Expect:** Free is fully usable but capped — 5 saves, no collections, no publishing, can't create a team (can still be *invited* to one).

---

## 6. Persona: Pro user (billing)

**Start at:** `/pricing` as **B** → **Go Pro** (Stripe test card `4242 4242 4242 4242`, any future expiry/CVC).

- [ ] Checkout completes → you return as **Pro** (avatar chip says Pro).
- [ ] Pro unlocks: **unlimited saves**, **collections**, full Showroom, **all export formats**, **API keys** (`/account/api`), **publishing**, and **team creation**.
- [ ] `/account` → **Manage billing** opens the Stripe portal.
- [ ] Receipt email arrives (if SMTP set).
- [ ] **Pricing page** lists **"Teams: shared brand kits, roles & reviews (up to 5 seats)"** under Pro.

**Expect:** the moment you're Pro, the upgrade nudges disappear and Teams/Publish become available.

---

## 7. Persona: Community creator

**Start at:** `/publish` as a **Pro** user (B or D).

- [ ] **Publish a palette:** paste colors → name, description, "why", license, visibility (Public / Unlisted / Private), tags → a live a11y score → **Publish** → lands on `/s/<slug>`.
- [ ] **`/explore`** → your public palette appears under **New**.
- [ ] **`/s/<slug>`** shows: colors, author link, description, rationale, a11y, license, tags, **Like**, **Save** (bookmark), **Remix** (only if the license allows derivatives), **Report**, and **Comments**.
- [ ] **Like** it from a second account → it surfaces under **Top**; the like count is accurate.
- [ ] **Save** it → appears in `/bookmarks`.
- [ ] **Comment** → posts; the palette owner (or comment author) can delete it.
- [ ] **Remix** → opens `/publish` pre-filled with the colors.
- [ ] **`/u/<handle>`** (set a handle in `/account` first) shows the profile: bio, website, follower/following counts, palette + like totals, and the published grid.
- [ ] **Follow** the creator from another account → follower count increments.
- [ ] **Visibility:** an **Unlisted** palette is reachable by link but **not** in Explore; a **Private** one is visible **only to the author** (others get 404).

**Moderation tie-in:** **Report** a palette, then verify it appears in the System Admin moderation queue (§9, `/sys/community`).

---

## 8. Persona: Teams & Governance (owner / admin / member)

This is the deepest area — work through it in order. **Owner = B**, **Member = C**.

### 8.1 Create a team & invite (as Owner B, Pro)
**Start at:** `/orgs`.
- [ ] Free users see an **Upgrade** card here; **Pro** users see **Create a team**. Create "Acme".
- [ ] You land on `/orgs/acme-…` as **owner**.
- [ ] **Members** shows you as owner. **Invite teammates** shows **"1 / 5 seats used"**.
- [ ] Invite **C** by email (role Member) → invite email sent (if SMTP) → **Pending invites** lists it.
- [ ] Sign in as **C**, open the invite link `/invite/<token>` → **Accept** → C joins; seat count becomes **2 / 5**.

### 8.2 Roles & seats
- [ ] As owner, change C's role **Member → Admin → Member** (only owners can change roles).
- [ ] **Last-owner protection:** you can't demote or remove the sole owner.
- [ ] **Admins** can invite/remove members but **can't** change roles or remove an owner.
- [ ] **Seat cap:** fill to 5 (members + pending invites); the 6th invite is **blocked** with an upgrade nudge. The invite form is replaced by an "at seat limit" message.

### 8.3 Brand kits (`/orgs/acme-…/kits`)
- [ ] **Admins/owners** can **Create a kit**; **members** see it but **can't** create.
- [ ] Open a kit → **Add a color** (one hex) and **a palette** (several hexes). One hex = a swatch; several = a palette.
- [ ] Each asset has **click-to-copy** hex chips and a Strata preview.
- [ ] A **lint score + issues** card shows for the whole kit (Wave 7 linter applied to the kit).

### 8.4 Review / approval workflow (governance)
- [ ] As **member C**, on the kit you see **"Propose a color/palette"** and **"Propose removal"** instead of direct edits.
- [ ] Submit a proposal → "Proposal submitted for review"; reviewers (owner/admins) get an email (if SMTP).
- [ ] As **owner B**, a **Pending proposals** queue appears with **Approve / Reject** (reject takes a reason). The kits list shows an **"N pending"** badge.
- [ ] **Approve** → the change lands in the kit; the proposer gets a decision email.
- [ ] **Reject** → kit unchanged; reviewer + reason recorded.

### 8.5 Verified domains & auto-join (`/orgs/acme-…/domains`)
- [ ] As admin, **claim a domain** (e.g. `acmeco.com`). Public providers (gmail/outlook/…) are **rejected**.
- [ ] A **TXT verification token** is shown. Add it to DNS in real life; here, click **Verify** (this is the single gated DNS-check point).
- [ ] Toggle **auto-join** on. Now sign in as a **new** user with a `@acmeco.com` email → they are **auto-added** to Acme as a member on first sign-in.
- [ ] Auto-join is recorded in the audit log as `member.joined (via: domain)`.

### 8.6 Audit log + export (`/orgs/acme-…/audit`)
- [ ] Owner/admin only (members get 404).
- [ ] Lists every event: `member.invited/joined/role_changed/removed`, `org.renamed`, `kit.created/deleted`, `proposal.created/approved/rejected`, `domain.added/verified/removed`.
- [ ] **Filter** by action; **Export CSV** and **Export JSON** download files.

### 8.7 Danger zone (owner only, bottom of `/orgs/acme-…`)
- [ ] **Export team data (JSON)** downloads a full bundle (org, members, invites, domains, kits+assets, proposals, audit).
- [ ] **Delete team** requires **typing the team name exactly** to arm the button; deleting cascades everything and returns you to `/orgs`.

**Expect:** members can *contribute* (propose) but only admins/owners *change* things; every change is logged and exportable; the owner controls lifecycle.

---

## 9. Persona: System Administrator (the platform operator)

**This is a separate world.** It is **not** reachable from the normal app nav, and a normal account—even yours—has no admin power.

**Start at:** `/sys/login`.

- [ ] The page is a **clean console login** (no site header/footer), labelled "System Administrator — authorized personnel only".
- [ ] First time: create the admin via `PLATFORM_BOOTSTRAP_EMAIL`/`PASSWORD` (seeded on first boot) or `npm run platform:admin -- create <email> "<name>"`.
- [ ] Sign in. If the password was bootstrap/reset, you're forced to **set a new password** (`/sys/password`).
- [ ] Visiting `/sys` while logged out **redirects to `/sys/login`** (never leaks content).

### 9.1 Two-factor (security)
**At:** `/sys/security`.
- [ ] **Set up 2FA** → shows a secret + `otpauth://` URI. Add it to an authenticator app (Google Authenticator, 1Password, Authy).
- [ ] Enter a 6-digit code to confirm → 2FA enabled; **10 backup codes shown once** (save them).
- [ ] Sign out, sign back in → after the password step it now asks for the **6-digit code**. A valid code (or a backup code) completes login. A wrong code is rejected.
- [ ] **Active sessions** list with **Revoke** / **Revoke all & sign out**.

### 9.2 Console sections
- [ ] **Dashboard** (`/sys`) — KPIs (users, saves, admins, open reports), system health, plan mix, recent activity.
- [ ] **Administrators** (`/sys/admins`) — create / disable / reset-password other admins; **last active admin can't be disabled**.
- [ ] **Users** (`/sys/users`) — search app users; **override a plan** (free/pro/studio) — used for comping. (Confirm the change reflects on that user's account.)
- [ ] **Billing** (`/sys/billing`) — subscription mix, est. MRR, Stripe configured/not.
- [ ] **Moderation** (`/sys/community`) — **open reports** (Dismiss / Remove palette) and **staff-pick** toggles (feature/unfeature → appears in Explore → Staff picks).
- [ ] **Audit log** (`/sys/audit`) — every privileged action, filterable. Confirm your **login**, **2FA enable**, **plan override**, and **feature toggle** all appear.
- [ ] **Feature flags** (`/sys/flags`) — create/enable/disable a flag.
- [ ] **Settings** (`/sys/settings`) — set a JSON key/value.
- [ ] **Sign out** clears the session; `/sys` is again gated.

**Expect:** a complete, isolated control room. Every write you do here shows up in `/sys/audit`.

---

## 10. Cross-cutting checks

- [ ] **Mobile (<768px):** hamburger opens a drawer with nav + auth actions; Escape/backdrop closes it. Studio, kit, dashboard, and `/sys` are usable at phone width.
- [ ] **`/status`** shows component health (database/auth/email/billing/rate-limiting/AI).
- [ ] **`/legal`** lists 14 policies; each renders; operator = **Open Air**, contact = **openair.mailer@gmail.com** throughout.
- [ ] **Live sync** (kit → tokens): on a kit, **Enable live sync**, copy the URL, open `…/tokens?format=css|scss|tailwind|dtcg|json&token=…` → returns tokens; **rotating** the token invalidates the old URL.
- [ ] **Robots:** `/sys`, `/orgs`, `/dashboard`, `/account`, `/api/` are disallowed from indexing.
- [ ] **No personal identity** appears anywhere in the UI (name, socials) — only "Open Air" and the mailer address.

---

## 11. Live Sync deep-check (optional, for token consumers)

**Start at:** a brand kit → **Live sync** → **Enable**.
- [ ] Copy the **DTCG** URL; open it → valid W3C design-token JSON.
- [ ] Swap `format=css` → CSS custom properties; `scss`, `tailwind`, `json` likewise.
- [ ] Re-request with the same `If-None-Match` ETag → **304 Not Modified** (no body).
- [ ] Add/approve a color change → the **version** in the response changes; if a webhook URL is set, it receives a POST.
- [ ] **Revoke** → the URL now returns 401.

---

## 12. Known limitations — *intentionally not built* (don't file as bugs)

- **Live SAML/OIDC IdP login** (Okta/Azure AD handshake) — domain-based **provisioning** is built; the live IdP handshake needs an env-configured provider and is deliberately deferred.
- **Domain DNS auto-check** — verification flips on the admin action; the automated DNS-TXT lookup is the one place wired for that check but not performed in this environment.
- **Webhook signing/retries** — the change webhook is best-effort `https` POST; HMAC signing + retries are a future hardening step.
- **Studio "save/version" of scales & token sets** — those tools are generate-and-export.
- **CSP** ships **report-only** until `CSP_ENFORCE=true`.
- **Email** is a no-op (logged) unless SMTP is configured — invites/receipts/notifications won't actually send without it.
- **TOTP QR image** — enrollment shows the secret + `otpauth://` URI (manual entry) rather than a rendered QR.

---

## 13. How to report an issue (use this for your audit)

For each finding, capture:

```
Area:            e.g. Teams › Review workflow
Persona:         Owner / Admin / Member / Free / Pro / Guest / SysAdmin
Route:           e.g. /orgs/acme-x/kits/brand-y
Steps:           1… 2… 3…
Expected:        what should happen (cite the box above)
Actual:          what happened
Console/Network: paste red errors or failed requests (status + name)
Viewport:        desktop / mobile (width)
Severity:        Broken / Missing / Polish
Screenshot:      attach if visual
```

Group findings as **Broken** (doesn't work), **Missing** (not there yet — check §12 first), or **Polish** (works but rough). Send the report over and I'll triage Broken first.

---

## Appendix — Route map by persona

| Persona | Key routes |
|---|---|
| Guest | `/`, `/gallery`, `/c`, `/p/[slug]`, `/explore`, `/s/[slug]`, `/u/[handle]`, `/trends`, `/studio/*`, `/pricing`, `/about`, `/legal/*`, `/status`, `/signin` |
| Free user | + `/dashboard`, `/onboarding`, `/account`, `/bookmarks` |
| Pro user | + `/account/api`, `/publish`, `/orgs` (create) |
| Team owner/admin | `/orgs/[slug]` (+ `/kits`, `/kits/[kitSlug]`, `/domains`, `/audit`), invite/seats/danger-zone |
| Team member | `/orgs/[slug]`, kits (view + propose), `/invite/[token]` |
| Community | `/publish`, `/explore`, `/s/[slug]`, `/u/[handle]`, `/bookmarks` |
| System Administrator | `/sys/login`, `/sys`, `/sys/admins`, `/sys/users`, `/sys/billing`, `/sys/community`, `/sys/audit`, `/sys/flags`, `/sys/settings`, `/sys/security`, `/sys/password` |

*Built across Waves 1–8. Migrations `0000`–`0014`. Operator: Open Air · openair.mailer@gmail.com.*
