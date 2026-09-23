"use client";

import React, { useTransition, useState } from "react";
import { authClient } from "@/src/configs/auth-client";
import { Button } from "@/src/shared/components/ui/button";
import { env } from "@/src/configs/config";

const HomePage = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = () => {
    setError(null);
    startTransition(async () => {
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${env.frontendUrl}/username`,
      });

      if (res.error) {
        setError(res.error.message ?? "Failed to sign in");
      }
    });
  };

  return (
    <div className="w-full h-screen flex flex-col gap-4 items-center justify-center">
      <Button disabled={isPending} onClick={signInWithGoogle}>
        {isPending ? "signing in.." : "Sign in with Google"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default HomePage;
