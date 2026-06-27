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

DB_PASS="${DB_PASS:-$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')}"
PROJECT_REF="fcwglkzfbnardhfymkah"
REGION="eu-north-1"

POOL_URL="postgresql://pact_app.${PROJECT_REF}:${DB_PASS}@aws-0-${REGION}.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_POOL="postgresql://pact_app.${PROJECT_REF}:${DB_PASS}@aws-0-${REGION}.pooler.supabase.com:5432/postgres"

PROD_URL="${1:-https://pact.vercel.app}"
AUTH_SECRET="${NEXTAUTH_SECRET:-$(openssl rand -base64 32)}"

add_env DATABASE_URL "$POOL_URL"
add_env DIRECT_URL "$DIRECT_POOL"
add_env NEXTAUTH_SECRET "$AUTH_SECRET"
add_env NEXTAUTH_URL "$PROD_URL"
add_env NEXT_PUBLIC_APP_URL "$PROD_URL"
add_env RESEND_API_KEY "$RESEND_API_KEY"
add_env EMAIL_FROM "${EMAIL_FROM:-Pact <onboarding@resend.dev>}"
add_env EMAIL_REPLY_TO "${EMAIL_REPLY_TO:-use.pact.features@gmail.com}"

[[ -n "${STRIPE_SECRET_KEY:-}" ]] && add_env STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY"
[[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]] && add_env STRIPE_WEBHOOK_SECRET "$STRIPE_WEBHOOK_SECRET"
[[ -n "${BLOB_READ_WRITE_TOKEN:-}" ]] && add_env BLOB_READ_WRITE_TOKEN "$BLOB_READ_WRITE_TOKEN"

echo "Done. Production URL: $PROD_URL"
