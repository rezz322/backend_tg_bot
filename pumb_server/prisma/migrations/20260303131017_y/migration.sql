/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "code" TEXT,
ADD COLUMN     "key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Account_key_key" ON "Account"("key");
