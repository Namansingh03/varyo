/*
  Warnings:

  - The values [PROCESSING] on the enum `UploadStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UploadStatus_new" AS ENUM ('SCHEDULED', 'COMPLETED', 'FAILED', 'PENDING');
ALTER TABLE "public"."content_upload" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "content_upload" ALTER COLUMN "status" TYPE "UploadStatus_new" USING ("status"::text::"UploadStatus_new");
ALTER TYPE "UploadStatus" RENAME TO "UploadStatus_old";
ALTER TYPE "UploadStatus_new" RENAME TO "UploadStatus";
DROP TYPE "public"."UploadStatus_old";
ALTER TABLE "content_upload" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
