"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

interface ApiBody {
  success: boolean;
  data: string | null;
  message: string;
}

function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) =>
      e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () =>
      xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error. Check MinIO CORS."));
    xhr.send(file);
  });
}

export default function ScheduleVideoForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [when, setWhen] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "scheduling" | "done" | "error"
  >("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    try {
      setStatus("uploading");
      setError("");

      // 1. Ask Express for a presigned MinIO URL
      const presign = await fetch(`${API}/api/socials/presigned`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: file.type,
          contentSize: file.size,
          provider: "YOUTUBE",
        }),
      });
      const presignBody = (await presign.json()) as ApiBody;
      if (!presign.ok || !presignBody.success)
        throw new Error(presignBody.message || "Could not create upload URL");

      // API returns `data` as a JSON-encoded string
      const { minioUrl, minioObjectKey } = JSON.parse(
        presignBody.data ?? "{}",
      ) as { minioUrl: string; minioObjectKey: string };

      // 2. Upload straight to MinIO
      await putWithProgress(minioUrl, file, setProgress);

      // 3. Schedule it
      setStatus("scheduling");
      const res = await fetch(`${API}/api/youtube/schedule`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectKey: minioObjectKey,
          title,
          description,
          scheduledAt: new Date(when).toISOString(),
          size: file.size,
        }),
      });
      const scheduleBody = (await res.json().catch(() => null)) as
        | (ApiBody & { error?: string })
        | null;
      if (!res.ok || !scheduleBody?.success)
        throw new Error(
          scheduleBody?.message ||
            scheduleBody?.error ||
            `Request failed: ${res.status}`,
        );
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 bg-white p-5 flex flex-col ">
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        required
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <input
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        required
      />

      <button
        disabled={status === "uploading" || status === "scheduling"}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {status === "scheduling" ? "Scheduling..." : "Schedule"}
      </button>

      {status === "uploading" && <progress value={progress} max={100} />}
      {status === "done" && <p>Scheduled ✅</p>}
      {status === "error" && <p className="text-red-600">{error}</p>}
    </form>
  );
}
