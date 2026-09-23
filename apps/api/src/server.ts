import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import youtubeRoutes from "./routes/youtube.routes";
import { env } from "./lib/config";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Varyo API is running",
  });
});

app.use("/api/youtube", youtubeRoutes);

app.listen(env.PORT, () => {
  console.log(`Varyo API running on http://localhost:${env.PORT}`);
});
