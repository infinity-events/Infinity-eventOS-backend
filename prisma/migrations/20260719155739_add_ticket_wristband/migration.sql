/*
  Warnings:

  - You are about to drop the column `price` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `wristbandId` on the `Ticket` table. All the data in the column will be lost.
  - The `status` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `rfidUid` on the `Wristband` table. All the data in the column will be lost.
  - The `status` column on the `Wristband` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[uid]` on the table `Wristband` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ticketId]` on the table `Wristband` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ticketId` to the `Wristband` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uid` to the `Wristband` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('GENERATED', 'ACTIVATED', 'USED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WristbandStatus" AS ENUM ('CREATED', 'SHIPPED', 'ACTIVATED', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_wristbandId_fkey";

-- DropForeignKey
ALTER TABLE "Wristband" DROP CONSTRAINT "Wristband_festivalId_fkey";

-- DropIndex
DROP INDEX "Ticket_wristbandId_key";

-- DropIndex
DROP INDEX "Wristband_rfidUid_key";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "price",
DROP COLUMN "type",
DROP COLUMN "wristbandId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "TicketStatus" NOT NULL DEFAULT 'GENERATED';

-- AlterTable
ALTER TABLE "Wristband" DROP COLUMN "rfidUid",
ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ticketId" TEXT NOT NULL,
ADD COLUMN     "uid" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "WristbandStatus" NOT NULL DEFAULT 'CREATED',
ALTER COLUMN "festivalId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Wristband_uid_key" ON "Wristband"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Wristband_ticketId_key" ON "Wristband"("ticketId");

-- AddForeignKey
ALTER TABLE "Wristband" ADD CONSTRAINT "Wristband_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wristband" ADD CONSTRAINT "Wristband_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "Festival"("id") ON DELETE SET NULL ON UPDATE CASCADE;
