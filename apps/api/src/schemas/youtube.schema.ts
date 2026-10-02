import { z } from "zod";

const scheduleFileSchema = z.object({
  objectKey: z.string(),
  title: z
    .string()
    .min(1, "min 1 character is required")
    .max(20, "title can be of max 20 length"),
  description: z.string().max(100, "description can be of max 100"),
  scheduledAt: z.date(),
});

export { scheduleFileSchema };
