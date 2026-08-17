CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

ALTER TABLE "Ticket" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "Ticket"
  ALTER COLUMN "paymentStatus" TYPE "PaymentStatus"
  USING "paymentStatus"::"PaymentStatus";
ALTER TABLE "Ticket"
  ALTER COLUMN "paymentStatus" SET DEFAULT 'PAID'::"PaymentStatus";
