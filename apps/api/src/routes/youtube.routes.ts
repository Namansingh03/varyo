import { Router } from "express";
import {
  type Router as RouterType,
  type Request,
  type Response,
} from "express";
import { google } from "googleapis";
import { getUserAccessTokens } from "../utils/getUserAccessToken";

const youtubeRoutes: RouterType = Router();

function youtubeClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.youtube({ version: "v3", auth: oauth2Client });
}

youtubeRoutes.get("/channel", async (req: Request, res: Response) => {
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

export default youtubeRoutes;
