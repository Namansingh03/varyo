"use client";

import React, { useTransition } from "react";
import { Button } from "@/src/shared/components/ui/button";
import { authClient } from "@/src/configs/auth-client";
import { YOUTUBE_SCOPES } from "@varyo/shared";

const ConnectPage = () => {
  const [isPending, startTransition] = useTransition();
  const connectYoutube = () => {
    startTransition(async () => {
      await authClient.linkSocial({
        provider: "google",
        scopes: YOUTUBE_SCOPES,
        callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/youtube`,
      });
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
