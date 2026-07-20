/*
  Warnings:

  - A unique constraint covering the columns `[uid]` on the table `Wristband` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uid` to the `Wristband` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wristband" ADD COLUMN     "uid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Wristband_uid_key" ON "Wristband"("uid");
