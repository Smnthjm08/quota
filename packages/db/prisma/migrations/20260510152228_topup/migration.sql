/*
  Warnings:

  - Made the column `size` on table `company` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `interval` on the `plan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PlanInterval" AS ENUM ('ONETIME', 'MONTH');

-- AlterTable
ALTER TABLE "company" ALTER COLUMN "size" SET NOT NULL;

-- AlterTable
ALTER TABLE "plan" DROP COLUMN "interval",
ADD COLUMN     "interval" "PlanInterval" NOT NULL;

-- CreateTable
CREATE TABLE "vault_top_up" (
    "id" SERIAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "amountUsdc" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "dodoPaymentId" TEXT,
    "txSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_top_up_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vault_top_up" ADD CONSTRAINT "vault_top_up_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
