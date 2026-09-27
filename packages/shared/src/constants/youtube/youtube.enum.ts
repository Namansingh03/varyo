import { z } from "zod";

const youtubePrivacyStatusSchema = z.enum(["public", "private", "unlisted"]);

export { youtubePrivacyStatusSchema };
