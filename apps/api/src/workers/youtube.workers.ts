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
      where: {
        id: job.data.postId,
      },
    });

    if (post.status === "COMPLETED" || post.status === "FAILED") {
      return;
    }

    const data = post.metadata as YoutubeContentMetaData;

    const init = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${job.data.accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(),
          "X-Upload-Content-Type": "video/mp4",
        },
        body: JSON.stringify({
          snippet: { title: data.title, description: data.description },
          status: { privacyStatus: "public" },
        }),
      },
    );
    if (!init.ok)
      throw new Error(
        `YouTube init failed: ${init.status} ${await init.text()}`,
      );
    const uploadUrl = init.headers.get("location")!;

    const stream = await minIo.getObject(BUCKET, data.objectKey);
    const upload = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(job.data.contentSize),
        "Content-Type": "video/mp4",
      },
      body: stream as any,
    });
    if (!upload.ok) throw new Error(`YouTube upload failed: ${upload.status}`);

    const video = await upload.json();
    await prisma.contentUpload.update({
      where: { id: post.id },
      data: {
        status: "COMPLETED",
        contentId: video.id,
      },
    });
  },
  { connection },
);
