import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Varyo API running on http://localhost:${PORT}`);
});
