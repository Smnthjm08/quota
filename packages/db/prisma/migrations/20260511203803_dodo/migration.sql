-- CreateTable
CREATE TABLE "dodo_payment" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT,
    "subscriptionId" TEXT,
    "amount" INTEGER,
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dodo_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dodo_payment_paymentId_key" ON "dodo_payment"("paymentId");

-- AddForeignKey
ALTER TABLE "dodo_payment" ADD CONSTRAINT "dodo_payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
