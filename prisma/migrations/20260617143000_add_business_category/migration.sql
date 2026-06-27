-- CreateEnum
CREATE TYPE "BusinessCategory" AS ENUM ('FREELANCER', 'LANDLORD', 'AGENCY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "businessCategory" "BusinessCategory";
