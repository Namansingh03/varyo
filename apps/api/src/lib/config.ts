import "dotenv/config";
import { z } from "zod";

const envConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters long"),

  BETTER_AUTH_URL: z.url(),

  NEXT_PUBLIC_API_URL: z.url(),

  GOOGLE_CLIENT_ID: z.string().min(1),

  GOOGLE_SECRET_KEY: z.string().min(1),

  DATABASE_URL: z.url(),
});

export const env = envConfigSchema.parse(process.env);
