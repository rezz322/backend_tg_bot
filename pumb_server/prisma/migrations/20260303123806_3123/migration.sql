/*
  Warnings:

  - You are about to drop the column `code` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `telegramUserId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `TelegramUser` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_telegramUserId_fkey";

-- DropIndex
DROP INDEX "Account_key_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "code",
DROP COLUMN "key",
DROP COLUMN "telegramUserId";

-- AlterTable
ALTER TABLE "TelegramUser" DROP COLUMN "isAdmin";
