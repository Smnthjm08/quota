/*
  Warnings:

  - A unique constraint covering the columns `[method,path]` on the table `RouteConfig` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `method` on the `RouteConfig` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE');

-- AlterTable
ALTER TABLE "RouteConfig" DROP COLUMN "method",
ADD COLUMN     "method" "HttpMethod" NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RouteConfig_method_path_key" ON "RouteConfig"("method", "path");
