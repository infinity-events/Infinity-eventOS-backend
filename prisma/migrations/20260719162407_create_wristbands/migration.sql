/*
  Warnings:

  - You are about to drop the column `balance` on the `Wristband` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Wristband` table. All the data in the column will be lost.
  - You are about to drop the column `uid` on the `Wristband` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Wristband` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Wristband` table without a default value. This is not possible if the table is not empty.
  - Made the column `festivalId` on table `Wristband` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Wristband" DROP CONSTRAINT "Wristband_festivalId_fkey";

-- DropIndex
DROP INDEX "Wristband_uid_key";

-- AlterTable
ALTER TABLE "Wristband" DROP COLUMN "balance",
DROP COLUMN "status",
DROP COLUMN "uid",
ADD COLUMN     "activated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "festivalId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Wristband_code_key" ON "Wristband"("code");

-- AddForeignKey
ALTER TABLE "Wristband" ADD CONSTRAINT "Wristband_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "Festival"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
