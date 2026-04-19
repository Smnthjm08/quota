/*
  Warnings:

  - You are about to drop the `RouteConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "RouteConfig";

-- CreateTable
CREATE TABLE "route_configs" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT '*',
    "priceUsdc" DECIMAL(18,6) NOT NULL,
    "meterId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 1,
    "freeQuota" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "route_configs_method_path_key" ON "route_configs"("method", "path");
