import {
  type Request,
  type Response,
  type Router as RouterType,
} from "express";
import { Router } from "express";
import { socialConnectSchema } from "../schemas/social.schemas";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

const socialRouter: RouterType = Router();

socialRouter.get("/connect", async (req: Request, res: Response) => {
  try {
    const parse_result = socialConnectSchema.safeParse(req.body);

    if (parse_result.error) {
      return res.status(403).json({
        success: false,
        message: parse_result.error.message,
        data: null,
      });
    }

    const { provider, scopes } = parse_result.data;

    await auth.api.linkSocialAccount({
      headers: fromNodeHeaders(req.headers),
      body: {
        provider,
        scopes,
      },
    });

    return res.status(200).json({
      success: true,
      message: `${provider} account connected`,
      data: provider,
    });
  } catch (error) {
    console.log("something went wrong while connecting route", error);
    return res.status(404).json({
      success: false,
      message: "something went wrong",
      data: null,
    });
  }
});

export default socialRouter;
