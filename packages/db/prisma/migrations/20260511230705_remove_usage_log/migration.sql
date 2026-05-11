/*
  Warnings:

  - You are about to drop the `usage_log` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "UsageEventType" ADD VALUE 'API_CONSUMED';

-- DropTable
DROP TABLE "usage_log";
