"use client";

import React, { useTransition } from "react";
import { Button } from "@/src/shared/components/ui/button";
import { YOUTUBE_SCOPES } from "@varyo/shared";
import { toast } from "sonner";

interface ConnectResponse {
  success: boolean;
  message: string;
  data: { url: string; redirect: boolean } | null;
  errors?: { path: string; message: string }[];
}

const ConnectPage = () => {
  const [isPending, startTransition] = useTransition();

  const connectYoutube = () => {
    startTransition(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/socials/connect`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify({
              provider: "YOUTUBE",
              scopes: YOUTUBE_SCOPES,
              callbackURL: "/youtube",
            }),
          },
        );

        const result = (await res.json().catch(() => null)) as ConnectResponse | null;

        if (!result) {
          toast.error(`unexpected response from the api (${res.status})`);
          return;
        }

        if (!result.success || !result.data) {
          toast.error(result.message, {
            description: result.errors?.map((e) => e.message).join(", "),
          });
          return;
        }

        window.location.href = result.data.url;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "failed to start connecting",
        );
      }
    });
  };

  return (
    <div>
      <Button onClick={() => connectYoutube()} disabled={isPending}>
        {isPending ? "connecting.." : "connect"}
      </Button>
    </div>
  );
};

export default ConnectPage;
