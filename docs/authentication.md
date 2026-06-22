# Authentication

*How users sign in, how teams auto-provision, and the fully-isolated System Administrator plane.*

![Authentication flow](./diagrams/authentication.svg)

## Purpose

Explain the two distinct authentication systems in Open Air — the application user auth (Auth.js) and the isolated platform-admin auth — and how membership/entitlements flow from a successful sign-in.

## Overview

There are **two separate authentication domains**:

1. **Application users** — [Auth.js v5](https://authjs.dev) with Google OAuth and email magic links, database-backed sessions. This powers the whole product.
2. **System Administrators** — a self-contained system at `/sys` with its own credential store, sessions, and login. It does **not** use Auth.js and never joins to the `users` table.

## Detailed explanation

### Application sign-in

Auth.js is configured in `lib/auth.ts`: Google OAuth + email provider, the Drizzle adapter, and **database sessions** (required for magic links). On sign-in:

```ts
// lib/auth.ts (excerpt)
callbacks: {
  session({ session, user }) {
    if (session.user && user) {
      session.user.id = user.id;
      session.user.plan = normalizePlan((user as any).plan);  // free | pro | studio
    }
    return session;
  },
},
events: {
  async signIn({ user }) {
    // Enterprise JIT provisioning: auto-seat into any team whose verified
    // email domain matches, with auto-join enabled.
    if (user?.id && user.email) await provisionMembershipsForEmail(user.id, user.email);
  },
},
```

**Entitlements** are derived server-side from `users.plan` via `getEntitlements()` — never trusted from the client. See [billing.md](./billing.md).

### Just-in-time team provisioning

A team can **claim and verify an email domain** (`/orgs/<slug>/domains`). When a user signs in with a matching verified email and auto-join is on, the `signIn` event seats them automatically and records it in the org audit log.

### Team invitations

Invites are email-addressed, single-use, 14-day tokens. Acceptance is **bound to the invited email** — only the account whose email matches the invite may redeem it.

### The System Administrator plane

The `/sys` console is an isolated authentication domain (`lib/platform/*`):

- **Credentials** — `platform_admins`, passwords hashed with **scrypt + random salt** (Node `crypto`, no dependency), with a strength gate and a `must_change_password` flow.
- **Sessions** — opaque tokens, SHA-256-hashed in `platform_sessions`, carried in an `httpOnly`, `SameSite=Strict`, `/sys`-scoped cookie (7-day expiry), server-revocable.
- **2FA** — TOTP (RFC 6238, implemented with `crypto`) with single-use backup codes; **mandatory by default** (toggle via the `require_2fa` platform setting). Login is a two-step challenge.
- **Brute-force protection** — the login and TOTP steps are IP/email rate-limited.
- **Bootstrap** — seed the first admin via `PLATFORM_BOOTSTRAP_*` env or the CLI:

```bash
npm run platform:admin -- create you@example.com "Your Name"
npm run platform:admin -- reset  you@example.com
```

## Best practices

- Require 2FA for every platform admin (the default). Keep **at least two** active admins.
- Rotate the bootstrap password after first sign-in, then clear `PLATFORM_BOOTSTRAP_PASSWORD`.
- Treat the `/sys` cookie as the crown jewels — it's `httpOnly` + path-scoped; sessions are revocable from `/sys/security`.

## Notes & common pitfalls

- **Don't grant app users admin power.** The old `isAdmin` flag was removed; `/admin` redirects to `/sys`. Platform authority is a separate domain by design.
- **Magic links require database sessions** — they won't work with JWT-only sessions.
- **LAN testing** — set `AUTH_URL` to your IP so callback URLs and emails don't point at `localhost`.

## Related

- [security.md](./security.md) · the broader security posture
- [billing.md](./billing.md) · plan → entitlements
- [environment.md](./environment.md) · auth provider keys
- [api.md](./api.md) · API-key auth for the public API
