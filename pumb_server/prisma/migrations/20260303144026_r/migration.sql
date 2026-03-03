-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "telegramUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_telegramUserId_fkey" FOREIGN KEY ("telegramUserId") REFERENCES "TelegramUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
