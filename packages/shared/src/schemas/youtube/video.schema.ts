import { z } from "zod";
import { YOUTUBE_LIMITS } from "../../constants/youtube/youtube.constants";
import { youtubePrivacyStatusSchema } from "../../constants/youtube/youtube.enum";

export const youtubeLicenseSchema = z.enum(["youtube", "creativeCommon"]);

const getUtf8ByteLength = (value: string) => {
  return new TextEncoder().encode(value).length;
};

const maxUtf8Bytes = (maxBytes: number, message: string) =>
  z.string().refine((value) => getUtf8ByteLength(value) <= maxBytes, message);

const getYouTubeTagsByteLength = (tags: string[]) => {
  const serialized = tags
    .map((tag) => {
      return /\s/.test(tag) ? `"${tag}"` : tag;
    })
    .join(",");

  return getUtf8ByteLength(serialized);
};

const youtubeTagsSchema = z
  .array(z.string().trim().min(1, "Tag cannot be empty"))
  .optional()
  .refine(
    (tags) =>
      !tags || getYouTubeTagsByteLength(tags) <= YOUTUBE_LIMITS.TAGS_MAX_BYTES,
    `Tags must be within ${YOUTUBE_LIMITS.TAGS_MAX_BYTES} bytes`,
  );

const youtubeVideoFileSchema = z
  .instanceof(File, {
    message: "A video file is required",
  })
  .refine(
    (file) => file.size <= YOUTUBE_LIMITS.VIDEO_MAX_BYTES,
    "Video must not exceed 256 GB",
  )
  .refine(
    (file) =>
      file.type.startsWith("video/") ||
      file.type === "application/octet-stream",
    "Invalid video MIME type",
  );

const youtubeVideoFields = {
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(
      YOUTUBE_LIMITS.TITLE_MAX_LENGTH,
      `Title cannot exceed ${YOUTUBE_LIMITS.TITLE_MAX_LENGTH} characters`,
    )
    .refine((value) => !/[<>]/.test(value), "Title cannot contain < or >"),

  description: maxUtf8Bytes(
    YOUTUBE_LIMITS.DESCRIPTION_MAX_BYTES,
    `Description cannot exceed ${YOUTUBE_LIMITS.DESCRIPTION_MAX_BYTES} bytes`,
  ).refine(
    (value) => !/[<>]/.test(value),
    "Description cannot contain < or >",
  ),

  tags: youtubeTagsSchema,

  categoryId: z.number(),

  privacyStatus: youtubePrivacyStatusSchema,

  license: youtubeLicenseSchema.optional(),

  embeddable: z.boolean().optional(),

  publicStatsViewable: z.boolean().optional(),

  selfDeclaredMadeForKids: z.boolean().optional(),

  containsSyntheticMedia: z.boolean().optional(),

  publishAt: z.coerce.date().optional(),
};

const scheduleRefinement = (
  data: {
    publishAt?: Date;
    privacyStatus: z.infer<typeof youtubePrivacyStatusSchema>;
  },
  ctx: z.RefinementCtx,
) => {
  if (data.publishAt) {
    if (data.privacyStatus !== "private") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["privacyStatus"],
        message: "Scheduled videos must have privacyStatus set to private",
      });
    }
    if (data.publishAt <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishAt"],
        message: "Scheduled publishing time must be in the future",
      });
    }
  }
};

export const youtubeUploadSchema = z
  .object({
    file: youtubeVideoFileSchema,

    ...youtubeVideoFields,
  })
  .superRefine(scheduleRefinement);

export type YouTubeUploadInput = z.infer<typeof youtubeUploadSchema>;

export const youtubeUploadMetadataSchema = z
  .object({
    ...youtubeVideoFields,

    contentType: z.string().min(1),
    contentSize: z
      .number()
      .int()
      .positive()
      .max(YOUTUBE_LIMITS.VIDEO_MAX_BYTES),
  })
  .superRefine(scheduleRefinement);

export type YouTubeUploadMetadata = z.infer<
  typeof youtubeUploadMetadataSchema
>;
