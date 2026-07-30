-- CreateEnum
CREATE TYPE "EntranceMethod" AS ENUM ('QR', 'NFC', 'MANUAL');

-- CreateTable
CREATE TABLE "EntranceLog" (
    "id" TEXT NOT NULL,
    "festivalId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "wristbandId" TEXT,
    "userId" TEXT,
    "operatorId" TEXT,
    "method" "EntranceMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntranceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntranceLog_festivalId_createdAt_idx" ON "EntranceLog"("festivalId", "createdAt");

-- CreateIndex
CREATE INDEX "EntranceLog_ticketId_idx" ON "EntranceLog"("ticketId");

-- AddForeignKey
ALTER TABLE "EntranceLog" ADD CONSTRAINT "EntranceLog_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "Festival"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntranceLog" ADD CONSTRAINT "EntranceLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntranceLog" ADD CONSTRAINT "EntranceLog_wristbandId_fkey" FOREIGN KEY ("wristbandId") REFERENCES "Wristband"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntranceLog" ADD CONSTRAINT "EntranceLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntranceLog" ADD CONSTRAINT "EntranceLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
