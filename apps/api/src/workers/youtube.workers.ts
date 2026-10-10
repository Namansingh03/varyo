import { redis as connection } from "../config/redis";
import { minIo, BUCKET } from "../config/minio";
import { prisma } from "../lib/prisma";
import { Worker } from "bullmq";
import { YoutubeContentMetaData } from "../types/youtube.types";

export const uploadYtVideoWorker = new Worker(
  "uploadVideo",
  async (job) => {
    console.log("yt worker is running");
    const post = await prisma.contentUpload.findUniqueOrThrow({
      where: { id: job.data.postId },
    });

    if (post.status === "COMPLETED" || post.status === "FAILED") {
      return;
    }

    const data = post.metadata as YoutubeContentMetaData;
    const contentSize = Number(job.data.contentSize);

    if (!Number.isSafeInteger(contentSize) || contentSize <= 0) {
      throw new Error("Invalid video content size in upload job");
    }

    const init = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${job.data.accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(contentSize),
          "X-Upload-Content-Type": "video/mp4",
        },
        body: JSON.stringify({
          snippet: { title: data.title, description: data.description },
          status: { privacyStatus: "public" },
        }),
      },
    );

    if (!init.ok) {
      throw new Error(
        `YouTube init failed: ${init.status} ${await init.text()}`,
      );
    }

    const uploadUrl = init.headers.get("location");
    if (!uploadUrl) {
      throw new Error("YouTube did not return a resumable upload URL");
    }
    const stream = await minIo.getObject(BUCKET, data.objectKey);
    const upload = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(contentSize),
        "Content-Type": "video/mp4",
      },
      body: stream as any,
      // @ts-ignore Node's fetch requires duplex for a streaming request body.
      duplex: "half",
    });

    if (!upload.ok) {
      throw new Error(
        `YouTube upload failed: ${upload.status} ${await upload.text()}`,
      );
    }

    const video = (await upload.json()) as { id?: string };
    if (!video.id) {
      throw new Error("YouTube upload response did not include a video ID");
    }

    await prisma.contentUpload.update({
      where: { id: post.id },
      data: {
        status: "COMPLETED",
        contentId: video.id,
        errorMessage: null,
      },
    });
  },
  { connection },
);
