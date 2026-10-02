import Redis from "ioredis";
import { env } from "./config";

export const redis = new Redis({
  host: env.REDIS_HOST ?? "localhost",
  port: env.REDIS_PORT ?? 6379,
});
