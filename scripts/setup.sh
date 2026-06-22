#!/usr/bin/env bash
# Open Air — one-shot local setup. Safe to re-run.
# Usage: bash scripts/setup.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▸ Node version:"; node -v
case "$(node -v)" in v2[2-9]*|v[3-9][0-9]*) ;; *) echo "  ⚠ Node 22+ recommended";; esac

echo "▸ Installing dependencies…"
if [ -f package-lock.json ]; then npm ci; else npm install; fi

if [ ! -f .env.local ]; then
  echo "▸ Creating .env.local from template (edit it to add keys — see SETUP-KEYS.md)…"
  cp .env.example .env.local
else
  echo "▸ .env.local already exists — leaving it untouched."
fi

# Only touch the DB if a connection string is configured.
if grep -qE '^DATABASE_URL="?[^"]+' .env.local 2>/dev/null; then
  echo "▸ DATABASE_URL found — applying migrations…"
  npm run db:migrate
  echo "▸ Seeding the catalog…"
  npm run db:seed || echo "  (seed skipped/failed — non-fatal)"
else
  echo "▸ No DATABASE_URL set — skipping DB migrate/seed. The static catalog still works."
  echo "  Add DATABASE_URL + AUTH_SECRET to .env.local, then: npm run db:migrate"
fi

echo
echo "✅ Setup complete. Start the app with:"
echo "     npm run dev          # http://localhost:3000"
echo
echo "Optional next steps:"
echo "  • Create a platform admin:  npm run platform:admin -- create you@example.com \"You\""
echo "  • Configure Stripe:         npm run stripe:setup"
echo "  • Full key instructions:    SETUP-KEYS.md"
