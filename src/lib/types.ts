export interface AnalyticsError {
  message: string;
  stack?: string;
  [key: string]: any;
}

export interface VideoInfo {
  videoUrl: string;
  thumbnailUrl: string;
  tweetUrl: string;
  tweetText: string;
  mediaId: string;
}
