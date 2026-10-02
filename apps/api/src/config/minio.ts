import { Client } from "minio";
import { env } from "./config";

export const BUCKET = "videos";

export const minIo = new Client({
  endPoint: env.MINIO_HOST_NAME ?? "localhost",
  port: env.MINIO_PORT ?? 9000,
  useSSL: true,
  accessKey: env.MINIO_ROOT_ACCESS_KEY,
  secretKey: env.MINIO_ROOT_SECRET_KEY,
});

export async function ensureBucket() {
  if (!(await minIo.bucketExists(BUCKET))) {
    minIo.makeBucket(BUCKET);
  }
}
