-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "device_id" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "pin_code" TEXT;

-- AlterTable
ALTER TABLE "TelegramUser" ADD COLUMN     "isWhitelisted" BOOLEAN NOT NULL DEFAULT false;
