/**
 * Represents the complete data structure of a tweet for screenshot generation
 */
export interface TweetData {
  /** Unique tweet ID */
  tweetId: string;
  /** User's display name (not the @handle) */
  displayName: string;
  /** User's @handle (without the @ symbol) */
  username: string;
  /** URL to user's avatar image */
  avatarUrl: string;
  /** Tweet text content */
  content: string;
  /** Tweet timestamp (ISO string or display text) */
  timestamp: string;
  /** Optional: datetime attribute from time element */
  datetime?: string;
  /** Whether user is verified */
  isVerified: boolean;
  /** URLs of images attached to the tweet */
  imageUrls: string[];
  /** Whether this is a retweet */
  isRetweet: boolean;
  /** Original tweet URL */
  tweetUrl: string;
}

/**
 * Options for screenshot generation
 */
export interface ScreenshotOptions {
  /** Theme for the screenshot card */
  theme: 'light' | 'dark' | 'auto';
  /** Whether to include watermark */
  showWatermark: boolean;
  /** Custom watermark text */
  watermarkText?: string;
  /** Scale factor for image quality (1-3) */
  scale: number;
}

/**
 * Default screenshot options
 */
export const DEFAULT_SCREENSHOT_OPTIONS: ScreenshotOptions = {
  theme: 'auto',
  showWatermark: false,
  scale: 2,
};
