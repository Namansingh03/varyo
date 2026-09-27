import {
  type Request,
  type Response,
  type Router as RouterType,
} from "express";
import { Router } from "express";
import {
  socialConnectSchema,
  resolveSocialProvider,
} from "../schemas/social.schemas";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

const socialRouter: RouterType = Router();

socialRouter.post("/connect", async (req: Request, res: Response) => {
  const parse_result = socialConnectSchema.safeParse(req.body);

  if (!parse_result.success) {
    return res.status(422).json({
      success: false,
      message: "invalid connect request",
      errors: parse_result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
      data: null,
    });
  }

  const { provider, scopes, callbackURL } = parse_result.data;

  try {
    const authResponse = await auth.api.linkSocialAccount({
      headers: fromNodeHeaders(req.headers),
      body: {
        provider: resolveSocialProvider(provider),
        scopes,
        ...(callbackURL ? { callbackURL } : {}),
      },
      asResponse: true,
    });

    for (const cookie of authResponse.headers.getSetCookie()) {
      res.append("set-cookie", cookie);
    }

    const payload = (await authResponse.json()) as {
      url?: string;
      redirect?: boolean;
      message?: string;
      code?: string;
    };

    if (!authResponse.ok || !payload.url) {
      return res.status(authResponse.status || 500).json({
        success: false,
        message: payload.message ?? "unable to start the provider authorization flow",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: `authorize ${provider} to finish connecting the account`,
      data: { url: payload.url, redirect: payload.redirect ?? true },
    });
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number((error as { status: unknown }).status)
        : 500;

    console.log("something went wrong while connecting route", error);

    return res.status(Number.isInteger(status) ? status : 500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "something went wrong",
      data: null,
    });
  }
});

export default socialRouter;
