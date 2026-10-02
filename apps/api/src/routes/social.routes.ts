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
import { minIo } from "../config/minio";
import { randomUUID } from "crypto";

const socialRouter: RouterType = Router();

const MAX_SIZE = 2 * 1024 * 1024 * 1024;

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
        message:
          payload.message ?? "unable to start the provider authorization flow",
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
      message: error instanceof Error ? error.message : "something went wrong",
      data: null,
    });
  }
});

socialRouter.post("/presigned", async (req: Request, res: Response) => {
  try {
    const { contentType, contentSize } = req.body;

    if (!/^video\/(mp4|quicktime|webm)$/.test(contentType))
      return res.status(400).json({
        success: false,
        data: null,
        message: "file type not supported",
      });
    if (!contentSize || contentSize > MAX_SIZE)
      return res.status(400).json({
        success: false,
        data: null,
        message: "file too large",
      });

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "session not found",
      });
    }

    const objectKey = `${session.user.id}/${randomUUID()}`;
    const url = await minIo.presignedPutObject("videos", objectKey, 15 * 60);

    return res.status(201).json({
      success: true,
      data: JSON.stringify({
        minioUrl: url,
        minioObjectKey: objectKey,
      }),
      message: "signed url created successfully",
    });
  } catch (error) {
    console.log("something went wrong while creating signed url", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "something went wrong while creating signed url",
    });
  }
});

export default socialRouter;
