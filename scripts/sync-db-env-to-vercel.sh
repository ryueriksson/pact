#!/usr/bin/env bash
# Push only DATABASE_URL + DIRECT_URL to Vercel production (fast DB fix).
set -euo pipefail

PROD_URL="${1:-https://usepact.vercel.app}"
POOL_URL="$(node scripts/build-vercel-db-urls.mjs | sed -n '1p')"
DIRECT_URL="$(node scripts/build-vercel-db-urls.mjs | sed -n '2p')"

add_env() {
  printf '%s' "$2" | npx vercel env add "$1" production --force
}

add_env DATABASE_URL "$POOL_URL"
add_env DIRECT_URL "$DIRECT_URL"

echo "DATABASE_URL + DIRECT_URL synced for $PROD_URL"
