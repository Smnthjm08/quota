-- CreateTable
CREATE TABLE "RouteConfig" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "priceUsdc" DECIMAL(10,6) NOT NULL,
    "meterId" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "freeQuota" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteConfig_pkey" PRIMARY KEY ("id")
);
