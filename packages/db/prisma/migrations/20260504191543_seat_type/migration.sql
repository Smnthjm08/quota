/*
  Warnings:

  - Added the required column `seatType` to the `seat` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('HUMAN', 'AGENT');

-- AlterTable
ALTER TABLE "seat" ADD COLUMN     "seatType" "SeatType" NOT NULL;
