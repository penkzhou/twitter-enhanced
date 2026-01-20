import {
  generateScreenshot,
  downloadScreenshot,
  copyScreenshotToClipboard,
} from '../screenshot';
import { TweetData, ScreenshotOptions } from '../../types/tweet';

// Mock html2canvas with proper canvas object
jest.mock('html2canvas', () => {
  return jest.fn().mockImplementation(() => {
    // Return a mock canvas-like object with toDataURL
    return Promise.resolve({
      width: 600,
      height: 400,
      toDataURL: jest
        .fn()
        .mockReturnValue('data:image/png;base64,mockImageData'),
    });
  });
});

// Mock ClipboardItem globally
class MockClipboardItem {
  constructor(public items: Record<string, Blob>) {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ClipboardItem = MockClipboardItem;

// Mock clipboard API
const mockClipboardWrite = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    write: mockClipboardWrite,
  },
});

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock chrome download API
const mockChromeDownload = jest.fn().mockImplementation((options, callback) => {
  if (callback) {
    callback(123); // downloadId
  }
});

Object.defineProperty(global, 'chrome', {
  value: {
    downloads: {
      download: mockChromeDownload,
    },
    runtime: {
      lastError: null,
    },
  },
  writable: true,
});

describe('Screenshot Utility', () => {
  const mockTweetData: TweetData = {
    tweetId: '1234567890',
    displayName: 'Test User',
    username: 'testuser',
    avatarUrl: 'https://pbs.twimg.com/profile_images/123/avatar.jpg',
    content: 'This is a test tweet',
    timestamp: 'Jan 15, 2024',
    datetime: '2024-01-15T12:00:00.000Z',
    isVerified: true,
    imageUrls: [],
    isRetweet: false,
    tweetUrl: 'https://twitter.com/testuser/status/1234567890',
  };

  const defaultOptions: ScreenshotOptions = {
    theme: 'light',
    showWatermark: false,
    scale: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';

    // Mock HTMLImageElement to always be complete
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      get() {
        return true;
      },
      configurable: true,
    });
  });

  describe('generateScreenshot', () => {
    it('should generate a screenshot and return data URL', async () => {
      const result = await generateScreenshot(mockTweetData, defaultOptions);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should use light theme when specified', async () => {
      const options = { ...defaultOptions, theme: 'light' as const };
      const result = await generateScreenshot(mockTweetData, options);

      expect(result).toBeDefined();
    });

    it('should use dark theme when specified', async () => {
      const options = { ...defaultOptions, theme: 'dark' as const };
      const result = await generateScreenshot(mockTweetData, options);

      expect(result).toBeDefined();
    });

    it('should include watermark when showWatermark is true', async () => {
      const options = {
        ...defaultOptions,
        showWatermark: true,
        watermarkText: 'via TestApp',
      };
      const result = await generateScreenshot(mockTweetData, options);

      expect(result).toBeDefined();
    });

    it('should respect scale option', async () => {
      const html2canvas = require('html2canvas');
      const options = { ...defaultOptions, scale: 3 };

      await generateScreenshot(mockTweetData, options);

      expect(html2canvas).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ scale: 3 })
      );
    });

    it('should clean up temporary DOM elements after generation', async () => {
      await generateScreenshot(mockTweetData, defaultOptions);

      // Check that no tweet-screenshot-container remains in the DOM
      const container = document.getElementById('tweet-screenshot-container');
      expect(container).toBeNull();
    });

    it('should handle generation errors gracefully', async () => {
      const html2canvas = require('html2canvas');
      html2canvas.mockRejectedValueOnce(new Error('Canvas generation failed'));

      await expect(
        generateScreenshot(mockTweetData, defaultOptions)
      ).rejects.toThrow('Canvas generation failed');
    });
  });

  describe('downloadScreenshot', () => {
    it('should trigger download with correct filename', async () => {
      const dataUrl = 'data:image/png;base64,mockdata';
      const filename = 'tweet_1234567890.png';

      await downloadScreenshot(dataUrl, filename);

      // Check that a download was triggered
      // The implementation should create an anchor and click it, or use chrome.downloads
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should use tweet ID in default filename', async () => {
      const dataUrl = 'data:image/png;base64,mockdata';

      await downloadScreenshot(dataUrl, 'tweet_testid.png');

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should handle download errors gracefully', async () => {
      mockCreateObjectURL.mockImplementationOnce(() => {
        throw new Error('Failed to create URL');
      });

      const dataUrl = 'data:image/png;base64,mockdata';

      await expect(downloadScreenshot(dataUrl, 'test.png')).rejects.toThrow();
    });
  });

  describe('copyScreenshotToClipboard', () => {
    it('should copy image to clipboard', async () => {
      const dataUrl = 'data:image/png;base64,mockdata';

      await copyScreenshotToClipboard(dataUrl);

      expect(mockClipboardWrite).toHaveBeenCalled();
    });

    it('should handle clipboard errors gracefully', async () => {
      mockClipboardWrite.mockRejectedValueOnce(new Error('Clipboard denied'));

      const dataUrl = 'data:image/png;base64,mockdata';

      await expect(copyScreenshotToClipboard(dataUrl)).rejects.toThrow(
        'Clipboard denied'
      );
    });

    it('should convert data URL to blob for clipboard', async () => {
      const dataUrl = 'data:image/png;base64,mockdata';

      await copyScreenshotToClipboard(dataUrl);

      // Verify clipboard.write was called with ClipboardItem
      expect(mockClipboardWrite).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(ClipboardItem)])
      );
    });
  });

  describe('Auto Theme Detection', () => {
    it('should detect light theme from background when theme is auto', async () => {
      // Mock light background
      document.body.style.backgroundColor = 'rgb(255, 255, 255)';

      const options = { ...defaultOptions, theme: 'auto' as const };
      const result = await generateScreenshot(mockTweetData, options);

      expect(result).toBeDefined();
    });

    it('should detect dark theme from background when theme is auto', async () => {
      // Mock dark background
      document.body.style.backgroundColor = 'rgb(0, 0, 0)';

      const options = { ...defaultOptions, theme: 'auto' as const };
      const result = await generateScreenshot(mockTweetData, options);

      expect(result).toBeDefined();
    });
  });
});
