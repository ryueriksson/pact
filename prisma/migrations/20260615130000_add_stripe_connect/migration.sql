-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeConnectId" TEXT,
ADD COLUMN "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeConnectId_key" ON "User"("stripeConnectId");
