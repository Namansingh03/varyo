-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Platform" ADD VALUE 'TIKTOK';
ALTER TYPE "Platform" ADD VALUE 'INSTAGRAM';
ALTER TYPE "Platform" ADD VALUE 'FACEBOOK';

-- CreateTable
CREATE TABLE "content_upload" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "providerVideoId" TEXT,
    "sessionUri" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_upload_userId_platform_idx" ON "content_upload"("userId", "platform");

-- CreateIndex
CREATE INDEX "content_upload_platform_status_idx" ON "content_upload"("platform", "status");

-- AddForeignKey
ALTER TABLE "content_upload" ADD CONSTRAINT "content_upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
