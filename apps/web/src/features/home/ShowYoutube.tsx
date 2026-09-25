"use client";

import { useState } from "react";

interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

export function YouTubeChannelCard() {
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchChannel() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/youtube/channel`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (res.status === 401) {
        setError("Please sign in first.");
        return;
      }

      if (res.status === 403) {
        setError("YouTube isn't connected yet.");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.message || body?.error || `Request failed: ${res.status}`,
        );
      }

      const data: YouTubeChannel = await res.json();

      setChannel(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 ">
      {/* Fetch button */}
      <button
        type="button"
        onClick={fetchChannel}
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Loading..." : "Fetch YouTube Channel"}
      </button>

      {/* Error */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Channel */}
      {channel && (
        <div className="flex bg-neutral-100 items-center gap-4 rounded-lg border p-4">
          <img
            src={channel.thumbnail}
            alt={channel.title}
            className="h-16 w-16 rounded-full"
          />

          <div>
            <h3 className="font-semibold">{channel.title}</h3>

            <p className="text-sm text-gray-500">
              {Number(channel.subscriberCount).toLocaleString()} subscribers ·{" "}
              {Number(channel.videoCount).toLocaleString()} videos ·{" "}
              {Number(channel.viewCount).toLocaleString()} views
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
