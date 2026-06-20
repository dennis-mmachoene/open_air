# Open Air — Navigation Guide & Pre-Wave-2 QA Checklist

*Two things in one doc: (1) how to move through the whole system, and (2) a structured walkthrough so you can report exactly what's missing or broken before we start Wave 2. Tick the boxes; note anything that fails using the report template at the end.*

---

## 1. The mental model

Open Air has three "surfaces", mapped to the product's three pillars:

- **Gallery** — *discover.* Browse the curated 108-palette catalog (public, no account needed).
- **Studio** — *create.* The tools: generate, extract, gradients, repair, and now **tonal scales** + **semantic tokens** (the new Wave-1 work).
- **Account** — *keep.* Save palettes, organize collections, manage billing.

Plus the **Showroom** (live UI preview that any palette re-themes) and **Aura**, the AI color assistant (the sparkle button, bottom-right).

The home page is *smart*: signed-out visitors get the marketing landing; signed-in users land in the gallery.

---

## 2. Site map (every route)

| Route | Who | What it does |
|---|---|---|
| `/` | Everyone | Landing (logged-out) or gallery (logged-in) |
| `/gallery` | Everyone | The full catalog with filters + infinite scroll |
| `/c` | Everyone | Collections & categories index |
| `/c/[slug]` | Everyone | A collection or category page (ISR) |
| `/p/[slug]` | Everyone | A palette: ramp, "why", contrast, Showroom, export (ISR) |
| `/studio` | Everyone | Studio hub — Showroom + tools row |
| `/studio/scales` | Everyone | **NEW** Tonal scale generator (50–950) |
| `/studio/tokens` | Everyone | **NEW** Semantic tokens + contrast matrix |
| `/studio/generate` | Everyone | Palette generator (client-side) |
| `/studio/extract` | Everyone | Extract palette from an image (in-browser) |
| `/studio/gradients` | Everyone | Gradient studio |
| `/studio/accessible` | Everyone | "Make any palette accessible" repair tool |
| `/pricing` | Everyone | Free / Pro plans + checkout |
| `/about` | Everyone | Mission, values, vision |
| `/legal` | Everyone | Index of the 14 policies |
| `/legal/[slug]` | Everyone | Each policy (terms, privacy, cookies, …) |
| `/status` | Everyone | Live system health |
| `/signin` | Everyone | Google + email magic-link sign-in |
| `/dashboard` | Signed-in | Saved palettes, usage meter, collections, recently viewed |
| `/onboarding` | Signed-in (new) | 2-step first-run; seeds the dashboard |
| `/account` | Signed-in | Profile, data export, delete account |
| `/account/api` | Signed-in (Pro) | API keys |
| `/admin` | Admin only | Overview KPIs |
| `/admin/users` | Admin only | User table |
| `/admin/content` | Admin only | Most-saved, popular use-cases |
| `/admin/health` | Admin only | Service health |
| `/terms`, `/privacy` | Everyone | Redirect to `/legal/*` |

Non-admins hitting `/admin/*` get a **404** by design (the area is cloaked).

---

## 3. How to get around

- **Top nav (desktop ≥768px):** logo → home; the link set changes with auth — logged-out shows *Gallery · Collections · Studio · Pricing · About*; logged-in shows *Gallery · Collections · Studio · Dashboard*. Right side: Sign in / Go Pro (guest) or plan chip + avatar menu (member).
- **Mobile (<768px):** the links collapse into a **hamburger drawer** (top-right). *(Note: the hamburger only appears under 768px — on desktop the full nav shows instead.)*
- **Avatar menu (member):** Dashboard · Account & billing · Upgrade (if free) · Admin (if admin) · Sign out.
- **Studio hub** (`/studio`): a "Studio tools" row links every tool — start there to reach scales, tokens, generate, extract, gradients, repair.
- **Aura (AI assistant):** the sparkle button bottom-right, on every page. Describe a project; it chats and suggests palettes. It greets members by name.
- **Footer:** nav, Terms · Privacy · Cookies · Legal · Status, and the attribution.

---

## 4. QA walkthrough — acceptance checklist

Run these in a browser with DevTools open (Console + Network). Tick what passes; for anything that fails, jump to §6 and file it.

### A. Guest / first impression (signed out)
- [ ] `/` shows the marketing landing with the "Now Showing" hero rotating palettes.
- [ ] Top nav shows *Gallery · Collections · Studio · Pricing · About* + Sign in + Go Pro.
- [ ] `/gallery` loads palettes; scrolling loads more (no console errors, no infinite refetch loop).
- [ ] Filters (mood/industry/family/style/season) narrow the grid.
- [ ] Open any palette `/p/...`: ramp, "why it works", contrast pairings, and the Showroom render.
- [ ] On a palette, **Save** and **Add to collection** funnel a guest to `/signin`.
- [ ] Export panel offers CSS/Tailwind for free; advanced formats prompt upgrade.

### B. Studio tools (signed out is fine)
- [ ] `/studio` hub shows the tools row; each link opens its tool.
- [ ] **Tonal scales** (`/studio/scales`): pick a color → 11 swatches (50–950); each row shows hex + ratio + AA/AAA in its own best text color; click a tone → detail panel; Copy CSS/Tailwind/JSON works.
- [ ] **Semantic tokens** (`/studio/tokens`): pick a brand color → 5 groups (Brand/Surfaces/Text/States/Status); light/dark toggle flips them; the **contrast matrix** renders; every fill shows AA (not "fail"); Copy works for all 3 formats.
- [ ] **Generate** (`/studio/generate`): sliders update the palette instantly (no lag/round-trips).
- [ ] **Extract** (`/studio/extract`): upload an image → a palette appears (image is *not* uploaded to a server — check Network).
- [ ] **Gradients** (`/studio/gradients`): builds a gradient.
- [ ] **Make accessible** (`/studio/accessible`): paste/select colors → repaired AA variants.

### C. Sign-in & onboarding
- [ ] `/signin`: Google sign-in works.
- [ ] `/signin`: email magic-link arrives and logs you in.
- [ ] First sign-in for a brand-new account routes to `/onboarding`; pick a use-case → pick palettes → lands on `/dashboard` with those seeded (saved + a "My picks" collection).
- [ ] After login, `/` redirects into the gallery and the nav switches to the app set.
- [ ] Avatar menu opens; all items navigate correctly; Sign out works.

### D. Save, collections, dashboard
- [ ] Heart a palette → it appears under Saved on `/dashboard`.
- [ ] Free plan: the usage meter shows `X / 5`; the 6th save is blocked with an upgrade nudge.
- [ ] `/dashboard` → Collections → **Create** a collection (instant, shows in the list, no silent failure).
- [ ] On a palette, **Add to collection** → tick an existing collection → it checks instantly and the dashboard count goes up.
- [ ] Delete a collection works.
- [ ] "Recently viewed" reflects palettes you opened.

### E. Billing (Stripe test mode)
- [ ] `/pricing` shows **Free + Pro** only (no Studio tier).
- [ ] "Go Pro" → Stripe Checkout; completing it (test card `4242…`) returns you as **Pro** (avatar chip says Pro).
- [ ] As Pro: unlimited saves; advanced exports unlocked; `/account/api` shows API keys.
- [ ] `/account` → Manage billing opens the Stripe portal.
- [ ] Receipt email arrives on payment (if SMTP configured).
- [ ] Cancel via portal → access stays until period end.

### F. AI assistant (Aura)
- [ ] Sparkle button opens the chat on any page.
- [ ] Signed in: it greets you by first name.
- [ ] Ask a real question ("explain complementary palettes") → a conversational answer, not just swatches.
- [ ] Ask for palettes ("calm fintech") → it suggests catalog palettes; links open them (guest → signin).
- [ ] Follow-up ("make it warmer") → it builds on context (multi-turn memory).

### G. Account & data
- [ ] `/account` → export data returns your data (`/api/account/export`).
- [ ] Delete account requires typing `DELETE`; completing it removes data + cancels any sub + signs you out.

### H. Admin (sign in with an `ADMIN_EMAILS` address)
- [ ] The **Admin** item appears in the avatar menu only for you.
- [ ] `/admin` overview KPIs load; `/admin/users` lists users; `/admin/content` shows insights; `/admin/health` is green.
- [ ] A non-admin account gets **404** on `/admin`.

### I. System & resilience
- [ ] `/status` shows component health (database/auth/email/billing/rate-limiting/AI).
- [ ] `/legal` lists 14 policies; each opens and renders formatted text.
- [ ] A bad URL shows the not-found page; a thrown error shows the error page (and reports to Sentry if DSN set).
- [ ] PostHog: load a few pages, then check PostHog → Activity shows `$pageview` events.

### J. Mobile (resize to <768px or DevTools device mode)
- [ ] The **hamburger** appears top-right; it opens a drawer with the nav + auth actions; Escape/backdrop closes it.
- [ ] Studio tools, palette pages, dashboard, and the token/scale tools are usable on a phone width.

---

## 5. Environment prerequisites (so you don't report intended "off" states as bugs)

| Feature | Needs | If missing |
|---|---|---|
| Catalog, Studio tools, scales, tokens | nothing | Always work |
| Accounts, saves, collections, dashboard, admin | `DATABASE_URL`, `AUTH_SECRET`, a provider | Sign-in disabled |
| Google sign-in | `AUTH_GOOGLE_ID/SECRET` | Google button absent |
| Magic-link + emails | `AUTH_EMAIL_SERVER/FROM` | No email sign-in / no receipts |
| Billing | `STRIPE_*` | Checkout disabled |
| AI assistant (real) | `GEMINI_API_KEY` | Falls back to keyword matching |
| Analytics | `NEXT_PUBLIC_POSTHOG_KEY` | No events |
| Error reporting | `SENTRY_DSN` | No Sentry events |
| API rate limiting (distributed) | `UPSTASH_*` | In-memory fallback |

Your `.env.local` has all of these set, so everything above should be live for you.

---

## 6. How to report an issue (use this template)

For each problem, capture:

```
Page/route:        e.g. /studio/tokens
Signed in?         yes (Pro) / no
Steps:             1… 2… 3…
Expected:          what should happen
Actual:            what happened
Console errors:    paste any red errors
Network:           any failed request (status + name)
Viewport:          desktop / mobile (width)
Screenshot:        attach if visual
```

Group your findings as **Broken** (doesn't work), **Missing** (not there yet), or **Polish** (works but rough). I'll triage and fix Broken first.

---

## 7. Known limitations — *intentionally not built yet* (don't file these as bugs)

These are roadmap items, not defects:

- **Teams / orgs / shared workspaces / brand kits** — Wave 6.
- **Community publishing, profiles, public/private visibility, feed** — Wave 5.
- **AI that *creates* full systems from a brief / edits the generator** — Wave 4.
- **Wave-2 accessibility intelligence** — whole-system stress testing (CVD/glare/print across the system), wide-gamut (P3/Rec.2020), print/CMYK. *(Per-palette CVD sim and AA gating already exist; the system-wide versions are next.)*
- **Saving/versioning tonal scales & token sets** — the scale/token tools are currently generate-and-export (no save yet); saving is Wave-1's later half.
- **Mobile hamburger** appears only **below 768px** by design.
- **CSP** ships **report-only** until you flip `CSP_ENFORCE=true` after watching reports.
- **Lighthouse/axe CI gate** — deferred (static jsx-a11y lint is active).
- **i18n / SSO / SAML / audit logs / DR runbook / status incidents history** — later waves.

---

*When you've run §4 and filled in §6 for anything that failed, send it over and I'll fix the Broken items, then we move into Wave 2.*
