#!/usr/bin/env bash
# Push .env values to Vercel (production). Run from project root after vercel link.
set -euo pipefail

add_env() {
  local name="$1"
  local value="$2"
  printf '%s' "$value" | npx vercel env add "$name" production --force
}

# Load local .env (not committed)
set -a
# shellcheck disable=SC1091
source .env
set +a

POOL_URL="$(node scripts/build-vercel-db-urls.mjs | sed -n '1p')"
DIRECT_POOL="$(node scripts/build-vercel-db-urls.mjs | sed -n '2p')"

PROD_URL="${1:-https://usepact.vercel.app}"
AUTH_SECRET="${NEXTAUTH_SECRET:-$(openssl rand -base64 32)}"

add_env DATABASE_URL "$POOL_URL"
add_env DIRECT_URL "$DIRECT_POOL"
add_env AUTH_SECRET "$AUTH_SECRET"
add_env NEXTAUTH_SECRET "$AUTH_SECRET"
add_env NEXTAUTH_URL "$PROD_URL"
add_env NEXT_PUBLIC_APP_URL "$PROD_URL"
add_env RESEND_API_KEY "$RESEND_API_KEY"
add_env EMAIL_FROM "${EMAIL_FROM:-Pact <onboarding@resend.dev>}"
add_env EMAIL_REPLY_TO "${EMAIL_REPLY_TO:-use.pact.features@gmail.com}"

[[ -n "${STRIPE_SECRET_KEY:-}" ]] && add_env STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY"
[[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]] && add_env STRIPE_WEBHOOK_SECRET "$STRIPE_WEBHOOK_SECRET"
[[ -n "${BLOB_READ_WRITE_TOKEN:-}" ]] && add_env BLOB_READ_WRITE_TOKEN "$BLOB_READ_WRITE_TOKEN"
[[ -n "${GOOGLE_CLIENT_ID:-}" ]] && add_env GOOGLE_CLIENT_ID "$GOOGLE_CLIENT_ID"
[[ -n "${GOOGLE_CLIENT_SECRET:-}" ]] && add_env GOOGLE_CLIENT_SECRET "$GOOGLE_CLIENT_SECRET"

echo "Done. Production URL: $PROD_URL"
