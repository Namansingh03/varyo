"use client";

import React, { useTransition, useState } from "react";
import { authClient } from "@/src/configs/auth-client";
import { Button } from "@/src/shared/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const HomePage = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const signInWithGoogle = () => {
    setError(null);
    startTransition(async () => {
      const { data: session } = await authClient.getSession();

      if (session?.user) {
        toast.success("session found");
        router.push("/youtube");
        return;
      }

      toast.error("session not found", {
        description: "signin to create a session",
      });

      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/connect`,
      });

      if (res.error) {
        setError(res.error.message ?? "Failed to sign in");
        console.log("signin error : ", res.error.message);
      }
    });
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
      <Button disabled={isPending} onClick={signInWithGoogle}>
        {isPending ? "signing in.." : "Sign in with Google"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default HomePage;
