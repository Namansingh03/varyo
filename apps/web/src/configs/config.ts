import { z } from "zod";

const envConfigSchema = z.object({
  frontendUrl: z.string(),
  backendUrl: z.string(),
});

export const env = envConfigSchema.parse(process.env);
