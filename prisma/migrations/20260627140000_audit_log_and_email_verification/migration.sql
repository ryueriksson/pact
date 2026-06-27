-- Grandfather existing users so they are not locked out after email verification ships.
UPDATE "User"
SET "emailVerified" = "createdAt"
WHERE "emailVerified" IS NULL;

CREATE TYPE "AuditAction" AS ENUM (
  'USER_REGISTERED',
  'USER_LOGIN',
  'USER_LOGIN_FAILED',
  'EMAIL_VERIFIED',
  'EMAIL_VERIFICATION_SENT',
  'PASSWORD_RESET',
  'ACCOUNT_DELETED',
  'PROPOSAL_PUBLISHED',
  'PROPOSAL_VIEWED',
  'PROPOSAL_SIGNED',
  'PROPOSAL_PAYMENT_INITIATED',
  'LEASE_CREATED',
  'LEASE_PUBLISHED',
  'LEASE_SIGNED',
  'LEASE_PAYMENT_INITIATED',
  'LEASE_DOCUMENT_ACCESSED',
  'LEASE_DOCUMENT_UPLOADED',
  'STRIPE_WEBHOOK'
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "action" "AuditAction" NOT NULL,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "AuditLog" FROM anon, authenticated;
