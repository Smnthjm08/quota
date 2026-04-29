-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'FAILED');

-- AlterTable
ALTER TABLE "company" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "pinCode" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "dodo_webhook_event" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'PROCESSING',
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dodo_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dodo_webhook_event_webhookId_key" ON "dodo_webhook_event"("webhookId");
