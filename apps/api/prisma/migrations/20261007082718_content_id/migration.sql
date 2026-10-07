/*
  Warnings:

  - You are about to drop the column `providerVideoId` on the `content_upload` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "content_upload" DROP COLUMN "providerVideoId",
ADD COLUMN     "contentId" TEXT;
