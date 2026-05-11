-- CreateEnum
CREATE TYPE "UsageEventType" AS ENUM ('VAULT_CREATED', 'VAULT_FUNDED', 'SEAT_CREATED', 'SEAT_UPDATED', 'SEAT_TOGGLED');

-- CreateTable
CREATE TABLE "usage_event" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "seatId" TEXT,
    "type" "UsageEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "amountUsdc" INTEGER,
    "txSignature" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_event_companyId_createdAt_idx" ON "usage_event"("companyId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "seat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
