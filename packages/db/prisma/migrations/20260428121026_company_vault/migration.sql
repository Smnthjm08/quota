/*
  Warnings:

  - A unique constraint covering the columns `[vaultPda]` on the table `company` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `company` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'ACTIVE', 'ON_HOLD', 'DISABLED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'TEAM');

-- AlterTable
ALTER TABLE "company" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ownerWalletPubkey" TEXT,
ADD COLUMN     "plan" "Plan",
ADD COLUMN     "size" TEXT,
ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vaultPda" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "company_vaultPda_key" ON "company"("vaultPda");
