/*
  Warnings:

  - You are about to drop the column `number` on the `Account` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Account_number_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "number",
ADD COLUMN     "android_id" TEXT,
ADD COLUMN     "board" TEXT,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "correlation_id" TEXT,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "fingerprint" TEXT,
ADD COLUMN     "hardware" TEXT,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "product" TEXT,
ADD COLUMN     "release" TEXT,
ADD COLUMN     "sdk" TEXT,
ADD COLUMN     "security_patch" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Account_phone_key" ON "Account"("phone");
