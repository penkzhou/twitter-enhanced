import { VideoInfo } from '../lib/types';
import { Logger } from '../utils/logger';

export interface DownloadResponse {
  success: boolean;
  error?: string;
  alreadyDownloaded?: boolean;
  recordId?: string;
  videoInfo?: VideoInfo[];
}

export interface IVideoDownloadService {
  getVideoInfo(tweetId: string): Promise<DownloadResponse>;
  downloadVideo(
    videoInfo: VideoInfo,
    tweetId: string
  ): Promise<DownloadResponse>;
  downloadMultipleVideos(
    videos: VideoInfo[],
    tweetId: string
  ): Promise<DownloadResponse[]>;
  openDownloadRecords(recordId?: string): void;
}

export class VideoDownloadService implements IVideoDownloadService {
  async getVideoInfo(tweetId: string): Promise<DownloadResponse> {
    return new Promise((resolve) => {
      const currentDomain = window.location.hostname;

      chrome.runtime.sendMessage(
        {
          action: 'getVideoInfo',
          tweetId: tweetId,
          currentDomain: currentDomain,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            Logger.logError(
              chrome.runtime.lastError.message ?? 'Unknown error',
              {
                tweet_id: tweetId,
                domain: currentDomain,
                error_type: 'get_video_info_error',
              }
            );

            resolve({
              success: false,
              error: chrome.runtime.lastError.message ?? 'Unknown error',
            });
          } else {
            Logger.logEvent('video_info_retrieved', {
              tweet_id: tweetId,
              video_count: response.videoInfo?.length || 0,
              already_downloaded: response.alreadyDownloaded || false,
            });

            resolve(response);
          }
        }
      );
    });
  }

  async downloadVideo(
    videoInfo: VideoInfo,
    tweetId: string
  ): Promise<DownloadResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: 'downloadVideo',
          videoInfo: videoInfo,
          tweetId: tweetId,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message ?? 'Unknown error';
            Logger.logError(error, {
              tweet_id: tweetId,
              video_url: videoInfo.videoUrl,
              error_type: 'download_video_error',
            });

            resolve({
              success: false,
              error: error,
            });
          } else if (response.success) {
            Logger.logEvent('video_download_initiated', {
              tweet_id: tweetId,
              video_url: videoInfo.videoUrl,
              media_id: videoInfo.mediaId,
            });

            resolve(response);
          } else {
            Logger.logError(response.error, {
              tweet_id: tweetId,
              video_url: videoInfo.videoUrl,
              error_type: 'download_failure',
            });

            resolve(response);
          }
        }
      );
    });
  }

  async downloadMultipleVideos(
    videos: VideoInfo[],
    tweetId: string
  ): Promise<DownloadResponse[]> {
    Logger.logEvent('multiple_video_download_initiated', {
      tweet_id: tweetId,
      video_count: videos.length,
    });

    const downloadPromises = videos.map((video) =>
      this.downloadVideo(video, tweetId)
    );

    return Promise.all(downloadPromises);
  }

  openDownloadRecords(recordId?: string): void {
    chrome.runtime.sendMessage({
      action: 'openDownloadRecords',
      recordId: recordId,
    });

    Logger.logEvent('download_records_opened', {
      record_id: recordId,
    });
  }

  getTweetId(tweetElement: Element): string | null {
    const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
    if (tweetLink) {
      const href = tweetLink.getAttribute('href');
      const match = href?.match(/\/status\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  hasVideoContent(tweetElement: Element): boolean {
    const videoContainer = tweetElement.querySelector(
      '[data-testid="videoComponent"], [data-testid="videoPlayer"], [data-testid="previewInterstitial"]'
    );
    const gifContainer = tweetElement.querySelector(
      '[data-testid="tweetPhoto"] img[src*=".gif"]'
    );

    return !!(videoContainer || gifContainer);
  }

  isDownloadButtonAdded(tweetElement: Element): boolean {
    return tweetElement.classList.contains('video-download-added');
  }

  markAsDownloadButtonAdded(tweetElement: Element): void {
    tweetElement.classList.add('video-download-added');
  }

  getActionBar(tweetElement: Element): Element | null {
    return tweetElement.querySelector('[role="group"]');
  }

  hasExistingDownloadButton(actionBar: Element): boolean {
    return !!actionBar.querySelector('.video-download-btn');
  }
}
