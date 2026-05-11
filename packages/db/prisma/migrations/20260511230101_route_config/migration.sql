-- CreateTable
CREATE TABLE "route_config" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_log" (
    "id" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "txSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "route_config_path_key" ON "route_config"("path");
