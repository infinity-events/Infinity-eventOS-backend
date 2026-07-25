-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_festivalId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "festivalId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "Festival"("id") ON DELETE SET NULL ON UPDATE CASCADE;
