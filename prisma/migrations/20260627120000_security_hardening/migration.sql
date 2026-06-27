-- Rotate weak lease share tokens (CUID defaults) to cryptographically secure hex tokens.
-- Requires pgcrypto (enabled by default on Supabase).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE "Lease"
SET token = encode(gen_random_bytes(32), 'hex')
WHERE length(token) < 64;

ALTER TABLE "Lease" ALTER COLUMN "token" DROP DEFAULT;

CREATE TABLE "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- RLS: app role bypasses; block anon/authenticated PostgREST access
ALTER TABLE "RateLimitBucket" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "RateLimitBucket" FROM anon, authenticated;
