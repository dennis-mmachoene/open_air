# Open Air — Operations & Disaster-Recovery Runbook

Operational reference for backups, restore, and incident response. Audience: the
System Administrator and any operator with infrastructure access. This document
is intentionally provider-specific where it helps; adapt hostnames/projects to
your environment.

## 1. Service topology

| Layer | Technology | Notes |
|---|---|---|
| App | Next.js 16 (App Router) | Stateless; safe to redeploy/scale horizontally |
| Database | Neon Postgres | Single source of truth for all mutable state |
| Auth | Auth.js v5 (DB sessions) | Sessions live in Postgres |
| Billing | Stripe | Source of truth for `users.plan` (via webhook) |
| Cache/limits | Upstash Redis | Best-effort; app degrades to in-memory |
| Email | SMTP (Nodemailer) | Non-critical; failures are logged, never block |

The public catalog renders from a static `snapshot.json`, so **read-only browse
survives a full database outage**. Accounts, teams, billing, and the admin
console require Postgres.

## 2. Recovery objectives

| Metric | Target |
|---|---|
| RPO (max data loss) | ≤ 5 minutes (Neon continuous WAL / PITR) |
| RTO (time to restore) | ≤ 60 minutes |

## 3. Backups

- **Database (primary):** Neon provides continuous backups with
  point-in-time-restore (PITR). Confirm PITR retention is set to **≥ 7 days**
  in the Neon project settings.
- **Logical snapshots (defence in depth):** run a scheduled `pg_dump` to
  offsite object storage daily:
  ```bash
  pg_dump "$DATABASE_URL" --no-owner --format=custom --file "openair-$(date +%F).dump"
  ```
- **Tenant-level exports:** team owners can self-serve a full JSON export at
  **/orgs/<slug>** → Danger zone → *Export team data*, or via
  `GET /api/orgs/<slug>/export` (owner only). Audit logs export from
  **/orgs/<slug>/audit** as CSV/JSON.
- **Secrets:** `.env.local` is **not** in version control. Keep a copy in your
  password manager / secrets vault. Required to boot in production:
  `DATABASE_URL`, `AUTH_SECRET`.

## 4. Restore procedures

### 4.1 Point-in-time restore (preferred)
1. In Neon, create a branch from the target timestamp (just before the incident).
2. Point `DATABASE_URL` at the restored branch (or promote it).
3. Redeploy the app; run `npm run db:migrate` only if the schema is behind.
4. Verify `/api/health` returns `200` and `/status` shows all green.

### 4.2 Restore from a logical dump
```bash
createdb openair_restore
pg_restore --no-owner --dbname "openair_restore" openair-YYYY-MM-DD.dump
# repoint DATABASE_URL, redeploy, run migrations if needed
```

### 4.3 Re-seed the public catalog (if catalog tables are lost)
```bash
npm run db:migrate
npm run db:seed       # seeds the catalog from snapshot.json
```

## 5. Migrations

- Migrations live in `drizzle/` (currently `0000`–`0014`). Apply with
  `npm run db:migrate`. They are forward-only; never edit a committed migration —
  add a new one.
- Before a risky migration, take a Neon branch as an instant rollback point.

## 6. Platform administration

- The System Administrator console is at **/sys** (isolated auth; password +
  TOTP 2FA). Bootstrap the first admin with `PLATFORM_BOOTSTRAP_EMAIL` /
  `PLATFORM_BOOTSTRAP_PASSWORD`, or `npm run platform:admin -- create <email>`.
- All privileged actions are recorded in `audit_logs` (viewable at
  **/sys/audit**). Active admin sessions can be revoked at **/sys/security**.
- Feature flags (**/sys/flags**) can disable a misbehaving capability without a
  deploy via `isFeatureEnabled(key)`.

## 7. Incident response (quick path)

1. **Assess:** check `/api/health` (booleans, no secrets) and `/status`.
2. **Contain:** if a feature is implicated, disable its flag at `/sys/flags`.
   If an admin account is compromised, revoke sessions at `/sys/security` and
   reset/disable the account at `/sys/admins`.
3. **Communicate:** post status; reach the operator at openair.mailer@gmail.com.
4. **Recover:** follow §4 for data loss; redeploy for app-only faults
   (the app is stateless).
5. **Review:** capture a timeline; file follow-ups. Privileged actions are
   already in the audit log.

## 8. Routine checks

- [ ] Neon PITR retention ≥ 7 days
- [ ] Daily `pg_dump` job succeeding to offsite storage
- [ ] `DATABASE_URL` + `AUTH_SECRET` backed up in the vault
- [ ] `npm ci && npm run build` green on `main` (CI gate)
- [ ] At least two active platform admins with 2FA enabled
