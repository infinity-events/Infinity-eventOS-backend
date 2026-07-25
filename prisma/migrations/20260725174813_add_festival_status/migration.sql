/*
  Warnings:

  - The `status` column on the `Festival` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FestivalStatus" AS ENUM ('BOZZA', 'ATTIVO', 'CHIUSO');

-- AlterTable
ALTER TABLE "Festival" DROP COLUMN "status",
ADD COLUMN     "status" "FestivalStatus" NOT NULL DEFAULT 'BOZZA';
