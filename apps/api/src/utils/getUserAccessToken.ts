import { type Request } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

interface getUserAccessTokenProps {
  provider: "google";
  req: Request;
}

export async function getUserAccessTokens({
  provider,
  req,
}: getUserAccessTokenProps) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      throw Object.assign(new Error("session not found"), { status: 401 });
    }

    const accounts = await auth.api.listUserAccounts({
      headers: fromNodeHeaders(req.headers),
    });

    const account = accounts.find((account) => account.providerId === provider);

    if (!account) {
      throw Object.assign(new Error("no linked account found"), {
        status: 403,
      });
    }

    const result = await auth.api.getAccessToken({
      body: {
        accountId: account.id,
      },
      headers: fromNodeHeaders(req.headers),
    });

    if (!result.accessToken) {
      throw Object.assign(new Error("access token not found"), { status: 400 });
    }

    return result.accessToken;
  } catch (error) {
    console.log("something went wrong while getting access tokens", error);
    throw error;
  }
}
