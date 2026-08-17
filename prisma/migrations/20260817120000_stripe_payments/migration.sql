ALTER TABLE "Festival" ADD COLUMN "stripeAccountId" TEXT;
ALTER TABLE "Festival" ADD COLUMN "stripeAccountStatus" TEXT;
CREATE UNIQUE INDEX "Festival_stripeAccountId_key" ON "Festival"("stripeAccountId");

ALTER TABLE "Ticket" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'PAID';
ALTER TABLE "Ticket" ADD COLUMN "stripeCheckoutSessionId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "stripePaymentIntentId" TEXT;
CREATE UNIQUE INDEX "Ticket_stripeCheckoutSessionId_key" ON "Ticket"("stripeCheckoutSessionId");
