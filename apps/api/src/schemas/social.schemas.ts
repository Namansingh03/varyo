import { z } from "zod";

export const socialProviderEnum = z.enum(["YOUTUBE"]);

const MAX_SIZE = 2 * 1024 * 1024 * 1024;

type socialProviderEnumType = z.infer<typeof socialProviderEnum>;

const socialConnectSchema = z.object({
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

type socialConnectSchemaType = z.infer<typeof socialConnectSchema>;

const SOCIAL_PROVIDER_BY_PLATFORM = {
  YOUTUBE: "google",
} as const satisfies Record<socialProviderEnumType, string>;

function resolveSocialProvider(platform: socialProviderEnumType) {
  return SOCIAL_PROVIDER_BY_PLATFORM[platform];
}

export { socialConnectSchema, resolveSocialProvider };

export type { socialConnectSchemaType, socialProviderEnumType };
