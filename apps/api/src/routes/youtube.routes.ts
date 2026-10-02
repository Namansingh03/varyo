import { Router } from "express";
import {
  type Router as RouterType,
  type Request,
  type Response,
} from "express";
import { google } from "googleapis";
import { getUserAccessTokens } from "../utils/getUserAccessToken";
import { prisma } from "../lib/prisma";
import { scheduleFileSchema } from "../schemas/youtube.schema";
import { minIo } from "../config/minio";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

const youtubeRoutes: RouterType = Router();

function youtubeClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.youtube({ version: "v3", auth: oauth2Client });
}

youtubeRoutes.get("/channel-details", async (req: Request, res: Response) => {
  try {
    const access_token_result = await getUserAccessTokens({
      provider: "google",
      req,
    });

    const youtube = youtubeClient(access_token_result);

    const result = await youtube.channels.list({
      part: ["snippet", "statistics", "contentDetails"],
      mine: true,
    });

    const channel = result.data.items?.[0];
    if (!channel) return res.status(404).json({ error: "No channel found" });

    res.json({
      id: channel.id,
      title: channel.snippet?.title,
      thumbnail: channel.snippet?.thumbnails?.default?.url,
      subscriberCount: channel.statistics?.subscriberCount,
      viewCount: channel.statistics?.viewCount,
      videoCount: channel.statistics?.videoCount,
    });
  } catch (error: any) {
    console.log("something went wrong while fetching channels", error);
    return res.status(error.status || 500).json({
      success: false,
      message: "something went wrong while fetching channels",
      data: null,
    });
  }
});

youtubeRoutes.post("/schedule", async (req: Request, res: Response) => {
  try {
    const { data, success } = await scheduleFileSchema.safeParse(req.body);

    if (!success) {
      return res.status(501).json({
        success: false,
        data: null,
        message: "invalid fields",
      });
    }

    const { description, objectKey, scheduledAt, title } = data;

    try {
      await minIo.statObject("videos", objectKey);
    } catch {
      return res.status(400).json({ error: "Video not found in storage" });
    }

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "unAuthorized",
      });
    }

    await prisma.contentUpload.create({
      data: {
        userId: session.user.id,
        platform: "YOUTUBE",
        scheduledFor: scheduledAt,
        status: "SCHEDULED",
        metadata: JSON.stringify({
          title,
          description,
          objectKey,
        }),
      },
    });

    //todo : add a bullMq worker to publish
  } catch (error) {
    console.log("something went wrong while scheduling the upload", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "something went wrong while scheduling the upload",
    });
  }
});

export default youtubeRoutes;
