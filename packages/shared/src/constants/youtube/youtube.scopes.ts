const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.upload",
];

const UPLOAD_YOUTUBE_SESSION_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos" +
  "?uploadType=resumable&part=snippet,status,contentDetails";

export { UPLOAD_YOUTUBE_SESSION_URL, YOUTUBE_SCOPES };
