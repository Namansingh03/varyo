import { redis } from "./redis";
import { Queue } from "bullmq";

export const uploadVideoQueue = new Queue("uploadVideo", { connection: redis });
