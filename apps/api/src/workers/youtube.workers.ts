import { redis as connection } from "../config/redis";
import { minIo, BUCKET } from "../config/minio";
import { prisma } from "../lib/prisma";
import { Worker } from "bullmq";
import { YoutubeContentMetaData } from "../types/youtube.types";

new Worker(
  "uploadVideo",
  async (job) => {
    const post = await prisma.contentUpload.findUniqueOrThrow({
      where: {
        id: job.data.postId,
      },
    });

    if (post.status === "SCHEDULED") {
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

    // (b) Stream the file from MinIO to that URL
    const stream = await minIo.getObject(BUCKET, data.objectKey);
    const upload = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(job.data.contentSize),
        "Content-Type": "video/mp4",
      },
      body: stream as any,
      // @ts-ignore required by Node's fetch for streaming bodies
      duplex: "half",
    });
    if (!upload.ok) throw new Error(`YouTube upload failed: ${upload.status}`);

    const video = await upload.json();
    await prisma.contentUpload.update({
      where: { id: post.id },
      data: {
        status: "SCHEDULED",
        contentId: video.id,
      },
    });
  },
  { connection },
);
