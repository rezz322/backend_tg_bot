/*
  Warnings:

  - You are about to drop the column `telegramUserId` on the `Account` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_telegramUserId_fkey";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "telegramUserId",
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "_UserAccounts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserAccounts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserAccounts_B_index" ON "_UserAccounts"("B");

-- AddForeignKey
ALTER TABLE "_UserAccounts" ADD CONSTRAINT "_UserAccounts_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserAccounts" ADD CONSTRAINT "_UserAccounts_B_fkey" FOREIGN KEY ("B") REFERENCES "TelegramUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
