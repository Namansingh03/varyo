import { uploadYtVideoWorker } from "./youtube.workers";

export const Workers = [uploadYtVideoWorker];

console.log("worker are running");
