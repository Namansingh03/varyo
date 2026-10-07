import { z } from "zod";
import { MAX_SIZE } from "../constants/youtube.constant";

export const socialProviderEnum = z.enum(["YOUTUBE"]);

type socialProviderEnumType = z.infer<typeof socialProviderEnum>;

export const socialConnectSchema = z.object({
  provider: socialProviderEnum,
  scopes: z.array(z.string()),
  callbackURL: z
    .string()
    .min(1)
    .refine(
      (value) => value.startsWith("/") || URL.canParse(value),
      "callbackURL must be a path or an absolute URL",
    )
    .optional(),
});

export const SOCIAL_PROVIDER_BY_PLATFORM = {
  YOUTUBE: "google",
} as const satisfies Record<socialProviderEnumType, string>;

export function resolveSocialProvider(platform: socialProviderEnumType) {
  return SOCIAL_PROVIDER_BY_PLATFORM[platform];
}

type socialConnectSchemaType = z.infer<typeof socialConnectSchema>;
export type { socialConnectSchemaType, socialProviderEnumType };
