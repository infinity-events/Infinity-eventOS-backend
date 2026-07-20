/*
  Warnings:

  - You are about to drop the column `status` on the `Wristband` table. All the data in the column will be lost.
  - Made the column `festivalId` on table `Wristband` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ticketId` on table `Wristband` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Wristband" DROP CONSTRAINT "Wristband_festivalId_fkey";

-- DropForeignKey
ALTER TABLE "Wristband" DROP CONSTRAINT "Wristband_ticketId_fkey";

-- AlterTable
ALTER TABLE "Wristband" DROP COLUMN "status",
ALTER COLUMN "festivalId" SET NOT NULL,
ALTER COLUMN "ticketId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Wristband" ADD CONSTRAINT "Wristband_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "Festival"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wristband" ADD CONSTRAINT "Wristband_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
