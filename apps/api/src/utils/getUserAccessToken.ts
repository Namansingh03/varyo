"use server";

import { type Request, type Response } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export async function getUserAccessTokens(
  provider: "google",
  req: Request,
  res: Response,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: "session not found",
        data: null,
      });
    }

    const { accessToken } = await auth.api.getAccessToken({
      body: {
        accountId: "google",
      },
      headers: fromNodeHeaders(req.headers),
    });

    if (!accessToken) {
      return res.status(403).json({
        success: false,
        message: "access token not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "access token found successfully",
      data: accessToken,
    });
  } catch (error) {
    console.log("something went wrong while getting access tokens", error);
    return res.status(404).json({
      success: false,
      message: "something went wrong",
      data: null,
    });
  }
}
