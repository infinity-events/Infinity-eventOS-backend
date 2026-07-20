/*
  Warnings:

  - Added the required column `price` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('STANDARD', 'VIP', 'STAFF');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "type" "TicketType" NOT NULL DEFAULT 'STANDARD';
