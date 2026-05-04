-- CreateTable
CREATE TABLE "seat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "holderPubkey" TEXT NOT NULL,
    "seatPda" TEXT NOT NULL,
    "monthlyLimit" INTEGER NOT NULL,
    "consumed" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "lastSpendAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seat_seatPda_key" ON "seat"("seatPda");

-- CreateIndex
CREATE UNIQUE INDEX "seat_companyId_holderPubkey_key" ON "seat"("companyId", "holderPubkey");

-- AddForeignKey
ALTER TABLE "seat" ADD CONSTRAINT "seat_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
