-- DropForeignKey
ALTER TABLE "Wristband" DROP CONSTRAINT "Wristband_festivalId_fkey";

-- DropForeignKey
ALTER TABLE "Wristband" DROP CONSTRAINT "Wristband_ticketId_fkey";

-- AlterTable
ALTER TABLE "Wristband" ALTER COLUMN "festivalId" DROP NOT NULL,
ALTER COLUMN "ticketId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Wristband" ADD CONSTRAINT "Wristband_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "Festival"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wristband" ADD CONSTRAINT "Wristband_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
