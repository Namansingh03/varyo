import { z } from "zod";
import { MAX_SIZE } from "../constants/youtube.constant";

const scheduleFileSchema = z
  .object({
    objectKey: z.string(),
    title: z
      .string()
      .min(1, "min 1 character is required")
      .max(20, "title can be of max 20 length"),
    description: z.string().max(100, "description can be of max 100"),
    scheduledAt: z.coerce.date(),
    size: z.number().max(MAX_SIZE).min(1),
  })
  .refine((data) => data.scheduledAt.getTime() > Date.now(), {
    message: "in valid schedule time",
    path: ["scheduledAt"],
  });

export { scheduleFileSchema };
