import {
  VideoDownloadService,
  DownloadResponse,
} from '../VideoDownloadService';
import { VideoInfo } from '../../lib/types';
import { Logger } from '../../utils/logger';

jest.mock('../../utils/logger');

const mockChromeRuntime = {
  sendMessage: jest.fn(),
  lastError: undefined as chrome.runtime.LastError | undefined,
};

// Mock global chrome object (Jest v30 compatible)
// Use Object.defineProperty for consistency
Object.defineProperty(global, 'chrome', {
  value: {
    runtime: mockChromeRuntime,
  },
  writable: true,
  configurable: true,
});

// Mock window.location (Jest v30 compatible)
// Will be set up in beforeEach to ensure proper mock state

describe('VideoDownloadService', () => {
  let videoDownloadService: VideoDownloadService;
  let mockLoggerLogEvent: jest.MockedFunction<typeof Logger.logEvent>;
  let mockLoggerLogError: jest.MockedFunction<typeof Logger.logError>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoggerLogEvent = Logger.logEvent as jest.MockedFunction<
      typeof Logger.logEvent
    >;
    mockLoggerLogError = Logger.logError as jest.MockedFunction<
      typeof Logger.logError
    >;
    mockChromeRuntime.lastError = undefined;

    // Force window.location to be configurable and mock it
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'twitter.com',
        host: 'twitter.com',
        protocol: 'https:',
        pathname: '/',
        search: '',
        hash: '',
        href: 'https://twitter.com',
        origin: 'https://twitter.com',
        port: '',
        toString: () => 'https://twitter.com',
      },
      writable: true,
      configurable: true,
    });

    videoDownloadService = new VideoDownloadService();
  });

  describe('getVideoInfo', () => {
    it('should successfully get video info', async () => {
      const tweetId = '123456789';
      const mockResponse: DownloadResponse = {
        success: true,
        videoInfo: [
          {
            videoUrl: 'https://example.com/video.mp4',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            tweetUrl: 'https://twitter.com/user/status/123',
            tweetText: 'Test tweet',
            mediaId: 'media123',
          },
        ],
      };

      mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse);
      });

      const result = await videoDownloadService.getVideoInfo(tweetId);

      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        {
          action: 'getVideoInfo',
          tweetId: tweetId,
          currentDomain: 'twitter.com',
        },
        expect.any(Function)
      );
      expect(result).toEqual(mockResponse);
      expect(mockLoggerLogEvent).toHaveBeenCalledWith('video_info_retrieved', {
        tweet_id: tweetId,
        video_count: 1,
        already_downloaded: false,
      });
    });

    it('should handle already downloaded video', async () => {
      const tweetId = '123456789';
      const mockResponse: DownloadResponse = {
        success: true,
        alreadyDownloaded: true,
        recordId: 'record123',
        videoInfo: [],
      };

      mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse);
      });

      const result = await videoDownloadService.getVideoInfo(tweetId);

      expect(result).toEqual(mockResponse);
      expect(mockLoggerLogEvent).toHaveBeenCalledWith('video_info_retrieved', {
        tweet_id: tweetId,
        video_count: 0,
        already_downloaded: true,
      });
    });

    it('should handle chrome runtime errors', async () => {
      const tweetId = '123456789';
      const errorMessage = 'Runtime error';

      mockChromeRuntime.lastError = { message: errorMessage };
      mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
        callback(null);
      });

      const result = await videoDownloadService.getVideoInfo(tweetId);

      expect(result).toEqual({
        success: false,
        error: errorMessage,
      });
      expect(mockLoggerLogError).toHaveBeenCalledWith(errorMessage, {
        tweet_id: tweetId,
        domain: 'twitter.com',
        error_type: 'get_video_info_error',
      });
    });

    it('should handle chrome runtime errors without message', async () => {
      const tweetId = '123456789';

      mockChromeRuntime.lastError = {} as chrome.runtime.LastError;
      mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
        callback(null);
      });

      const result = await videoDownloadService.getVideoInfo(tweetId);

      expect(result).toEqual({
        success: false,
        error: 'Unknown error',
      });
    });
  });

  describe('downloadVideo', () => {
    const mockVideoInfo: VideoInfo = {
      videoUrl: 'https://example.com/video.mp4',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      tweetUrl: 'https://twitter.com/user/status/123',
      tweetText: 'Test tweet',
      mediaId: 'media123',
    };
    const tweetId = '123456789';

    it('should successfully download video', async () => {
      const mockResponse: DownloadResponse = { success: true };

      mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse);
      });

      const result = await videoDownloadService.downloadVideo(
        mockVideoInfo,
        tweetId
      );

      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        {
          action: 'downloadVideo',
          videoInfo: mockVideoInfo,
          tweetId: tweetId,
        },
        expect.any(Function)
      );
      expect(result).toEqual(mockResponse);
      expect(mockLoggerLogEvent).toHaveBeenCalledWith(
        'video_download_initiated',
        {
          tweet_id: tweetId,
          video_url: mockVideoInfo.videoUrl,
          media_id: mockVideoInfo.mediaId,
        }
      );
    });

    it('should handle download failure from response', async () => {
      const mockResponse: DownloadResponse = {
        success: false,
        error: 'Download failed',
      };

      mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse);
      });

      const result = await videoDownloadService.downloadVideo(
        mockVideoInfo,
        tweetId
      );

      expect(result).toEqual(mockResponse);
      expect(mockLoggerLogError).toHaveBeenCalledWith('Download failed', {
        tweet_id: tweetId,
        video_url: mockVideoInfo.videoUrl,
        error_type: 'download_failure',
      });
    });

    it('should handle chrome runtime errors during download', async () => {
      const errorMessage = 'Runtime error during download';

      mockChromeRuntime.lastError = { message: errorMessage };
      mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
        callback(null);
      });

      const result = await videoDownloadService.downloadVideo(
        mockVideoInfo,
        tweetId
      );

      expect(result).toEqual({
        success: false,
        error: errorMessage,
      });
      expect(mockLoggerLogError).toHaveBeenCalledWith(errorMessage, {
        tweet_id: tweetId,
        video_url: mockVideoInfo.videoUrl,
        error_type: 'download_video_error',
      });
    });
  });

  describe('downloadMultipleVideos', () => {
    const mockVideos: VideoInfo[] = [
      {
        videoUrl: 'https://example.com/video1.mp4',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        tweetUrl: 'https://twitter.com/user/status/123',
        tweetText: 'Test tweet 1',
        mediaId: 'media123',
      },
      {
        videoUrl: 'https://example.com/video2.mp4',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        tweetUrl: 'https://twitter.com/user/status/123',
        tweetText: 'Test tweet 2',
        mediaId: 'media456',
      },
    ];
    const tweetId = '123456789';

    it('should download multiple videos successfully', async () => {
      const mockResponse: DownloadResponse = { success: true };

      mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse);
      });

      const results = await videoDownloadService.downloadMultipleVideos(
        mockVideos,
        tweetId
      );

      expect(results).toHaveLength(2);
      expect(results.every((result) => result.success)).toBe(true);
      expect(mockLoggerLogEvent).toHaveBeenCalledWith(
        'multiple_video_download_initiated',
        {
          tweet_id: tweetId,
          video_count: 2,
        }
      );
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and failure results', async () => {
      mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
        if (
          message.videoInfo &&
          message.videoInfo.videoUrl.includes('video1')
        ) {
          callback({ success: true });
        } else {
          callback({ success: false, error: 'Download failed' });
        }
      });

      const results = await videoDownloadService.downloadMultipleVideos(
        mockVideos,
        tweetId
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('openDownloadRecords', () => {
    beforeEach(() => {
      // Reset the mock implementation for openDownloadRecords tests
      mockChromeRuntime.sendMessage.mockImplementation((message) => {
        // Just mock the sendMessage call without callback
      });
    });

    it('should open download records without record ID', () => {
      videoDownloadService.openDownloadRecords();

      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith({
        action: 'openDownloadRecords',
        recordId: undefined,
      });
      expect(mockLoggerLogEvent).toHaveBeenCalledWith(
        'download_records_opened',
        {
          record_id: undefined,
        }
      );
    });

    it('should open download records with specific record ID', () => {
      const recordId = 'record123';

      videoDownloadService.openDownloadRecords(recordId);

      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith({
        action: 'openDownloadRecords',
        recordId: recordId,
      });
      expect(mockLoggerLogEvent).toHaveBeenCalledWith(
        'download_records_opened',
        {
          record_id: recordId,
        }
      );
    });
  });

  describe('getTweetId', () => {
    it('should extract tweet ID from tweet element', () => {
      const mockElement = document.createElement('div');
      const tweetLink = document.createElement('a');
      tweetLink.setAttribute('href', '/user/status/123456789');
      mockElement.appendChild(tweetLink);

      const tweetId = videoDownloadService.getTweetId(mockElement);

      expect(tweetId).toBe('123456789');
    });

    it('should return null when no tweet link found', () => {
      const mockElement = document.createElement('div');

      const tweetId = videoDownloadService.getTweetId(mockElement);

      expect(tweetId).toBeNull();
    });

    it('should return null when tweet link has invalid format', () => {
      const mockElement = document.createElement('div');
      const tweetLink = document.createElement('a');
      tweetLink.setAttribute('href', '/user/invalid');
      mockElement.appendChild(tweetLink);

      const tweetId = videoDownloadService.getTweetId(mockElement);

      expect(tweetId).toBeNull();
    });
  });

  describe('hasVideoContent', () => {
    it('should return true when video component exists', () => {
      const mockElement = document.createElement('div');
      const videoElement = document.createElement('div');
      videoElement.setAttribute('data-testid', 'videoComponent');
      mockElement.appendChild(videoElement);

      const hasVideo = videoDownloadService.hasVideoContent(mockElement);

      expect(hasVideo).toBe(true);
    });

    it('should return true when video player exists', () => {
      const mockElement = document.createElement('div');
      const videoElement = document.createElement('div');
      videoElement.setAttribute('data-testid', 'videoPlayer');
      mockElement.appendChild(videoElement);

      const hasVideo = videoDownloadService.hasVideoContent(mockElement);

      expect(hasVideo).toBe(true);
    });

    it('should return true when GIF exists', () => {
      const mockElement = document.createElement('div');
      const tweetPhoto = document.createElement('div');
      tweetPhoto.setAttribute('data-testid', 'tweetPhoto');
      const gifImage = document.createElement('img');
      gifImage.setAttribute('src', 'https://example.com/image.gif');
      tweetPhoto.appendChild(gifImage);
      mockElement.appendChild(tweetPhoto);

      const hasVideo = videoDownloadService.hasVideoContent(mockElement);

      expect(hasVideo).toBe(true);
    });

    it('should return false when no video content exists', () => {
      const mockElement = document.createElement('div');

      const hasVideo = videoDownloadService.hasVideoContent(mockElement);

      expect(hasVideo).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should check if download button is added', () => {
      const mockElement = document.createElement('div');
      mockElement.classList.add('video-download-added');

      expect(videoDownloadService.isDownloadButtonAdded(mockElement)).toBe(
        true
      );
    });

    it('should mark element as having download button added', () => {
      const mockElement = document.createElement('div');

      videoDownloadService.markAsDownloadButtonAdded(mockElement);

      expect(mockElement.classList.contains('video-download-added')).toBe(true);
    });

    it('should get action bar from tweet element', () => {
      const mockElement = document.createElement('div');
      const actionBar = document.createElement('div');
      actionBar.setAttribute('role', 'group');
      mockElement.appendChild(actionBar);

      const result = videoDownloadService.getActionBar(mockElement);

      expect(result).toBe(actionBar);
    });

    it('should check if existing download button exists in action bar', () => {
      const actionBar = document.createElement('div');
      const downloadButton = document.createElement('div');
      downloadButton.className = 'video-download-btn';
      actionBar.appendChild(downloadButton);

      const hasButton =
        videoDownloadService.hasExistingDownloadButton(actionBar);

      expect(hasButton).toBe(true);
    });
  });
});
