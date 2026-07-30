/*
  Warnings:

  - The values [USED] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `action` to the `EntranceLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EntranceAction" AS ENUM ('ENTRY', 'EXIT');

-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('GENERATED', 'ACTIVATED', 'CANCELLED');
ALTER TABLE "public"."Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "public"."TicketStatus_old";
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'GENERATED';
COMMIT;

-- DropIndex
DROP INDEX "EntranceLog_festivalId_createdAt_idx";

-- DropIndex
DROP INDEX "EntranceLog_ticketId_idx";

-- AlterTable
ALTER TABLE "EntranceLog" ADD COLUMN     "action" "EntranceAction" NOT NULL,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "gate" TEXT;
