import { z } from "zod";

export const socialProviderEnum = z.enum(["YOUTUBE"]);

const socialConnectSchema = z.object({
  provider: socialProviderEnum,
  scopes: z.array(z.string()),
});

type socialConnectSchemaType = z.infer<typeof socialConnectSchema>;

export { socialConnectSchema };

export type { socialConnectSchemaType };
