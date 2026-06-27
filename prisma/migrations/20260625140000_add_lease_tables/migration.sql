-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeasePaymentType" AS ENUM ('DEPOSIT', 'RENT');

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "unitNumber" TEXT,
    "tenantName" TEXT NOT NULL,
    "tenantEmail" TEXT NOT NULL,
    "monthlyRent" INTEGER NOT NULL,
    "depositAmount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "leaseStart" TIMESTAMP(3) NOT NULL,
    "leaseEnd" TIMESTAMP(3) NOT NULL,
    "leaseDocUrl" TEXT,
    "contractBody" TEXT,
    "skipSigning" BOOLEAN NOT NULL DEFAULT false,
    "status" "LeaseStatus" NOT NULL DEFAULT 'DRAFT',
    "token" TEXT NOT NULL,
    "stripeSubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseContract" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaseContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeasePayment" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "type" "LeasePaymentType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeSessionId" TEXT,
    "stripeInvoiceId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeasePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lease_token_key" ON "Lease"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Lease_stripeSubId_key" ON "Lease"("stripeSubId");

-- CreateIndex
CREATE INDEX "Lease_userId_idx" ON "Lease"("userId");

-- CreateIndex
CREATE INDEX "Lease_token_idx" ON "Lease"("token");

-- CreateIndex
CREATE INDEX "Lease_status_idx" ON "Lease"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseContract_leaseId_key" ON "LeaseContract"("leaseId");

-- CreateIndex
CREATE UNIQUE INDEX "LeasePayment_stripeSessionId_key" ON "LeasePayment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "LeasePayment_stripeInvoiceId_key" ON "LeasePayment"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "LeasePayment_leaseId_idx" ON "LeasePayment"("leaseId");

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseContract" ADD CONSTRAINT "LeaseContract_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeasePayment" ADD CONSTRAINT "LeasePayment_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grant access to app user
GRANT ALL ON TABLE "Lease" TO pact_app;
GRANT ALL ON TABLE "LeaseContract" TO pact_app;
GRANT ALL ON TABLE "LeasePayment" TO pact_app;
GRANT USAGE ON TYPE "LeaseStatus" TO pact_app;
GRANT USAGE ON TYPE "LeasePaymentType" TO pact_app;
