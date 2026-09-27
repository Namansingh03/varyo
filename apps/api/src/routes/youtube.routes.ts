import { Router } from "express";
import {
  type Router as RouterType,
  type Request,
  type Response,
} from "express";
import { google } from "googleapis";
import { getUserAccessTokens } from "../utils/getUserAccessToken";
import { youtubeUploadMetadataSchema } from "@varyo/shared/schemas/youtube/video.schema";
import { UPLOAD_YOUTUBE_SESSION_URL } from "@varyo/shared";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "../lib/prisma";

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

youtubeRoutes.post("/upload-video", async (req: Request, res: Response) => {
  const parsed_result = await youtubeUploadMetadataSchema.safeParse(req.body);

  if (!parsed_result.success) {
    return res.status(400).json({
      success: false,
      message: "invalid upload metadata",
      errors: parsed_result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
      data: null,
    });
  }

  const { publishAt, contentSize, contentType, ...rest } = parsed_result.data;

  try {
    const access_Token = await getUserAccessTokens({
      provider: "google",
      req,
    });

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        message: "session not found",
        data: null,
      });
    }

    const upload = await prisma.contentUpload.create({
      data: {
        platform: "YOUTUBE",
        userId: session.user.id,
        scheduledFor: publishAt ?? null,
        metadata: { ...rest, publishAt: publishAt?.toISOString() },
      },
    });

    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({ access_token: access_Token });

    const youtube_session = await oauth2.request({
      url: UPLOAD_YOUTUBE_SESSION_URL,
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": contentType,
        "X-Upload-Content-Length": String(contentSize),
      },
      data: JSON.stringify({
        snippet: {
          title: rest.title,
          description: rest.description,
          tags: rest.tags,
          categoryId: String(rest.categoryId),
        },
        status: {
          privacyStatus: rest.privacyStatus,
          license: rest.license,
          embeddable: rest.embeddable,
          publicStatsViewable: rest.publicStatsViewable,
          selfDeclaredMadeForKids: rest.selfDeclaredMadeForKids,
          containsSyntheticMedia: rest.containsSyntheticMedia,
          publishAt: publishAt?.toISOString(),
        },
      }),
    });

    const yt_session_uri = youtube_session.headers.get("location");

    if (!yt_session_uri) {
      throw Object.assign(new Error("YouTube did not return a session URI"), {
        status: 502,
      });
    }

    await prisma.contentUpload.update({
      where: {
        id: upload.id,
      },
      data: {
        sessionUri: yt_session_uri,
      },
    });

    return res.status(201).json({
      success: true,
      message: "upload session created",
      data: {
        upload_id: upload.id,
        yt_session_uri: yt_session_uri,
      },
    });
  } catch (error: any) {
    console.log("something went wrong while uploading video", error);
    return res.status(error.status || 500).json({
      success: false,
      message: "something went wrong while uploading video",
      data: null,
    });
  }
});

export default youtubeRoutes;
