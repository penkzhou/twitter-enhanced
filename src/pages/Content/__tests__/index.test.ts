import React from 'react';

// Mock all dependencies before importing the module
jest.mock('react', () => ({
  createElement: jest.fn(),
}));

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

jest.mock('../../../utils/logger', () => ({
  Logger: {
    logEvent: jest.fn(),
    logError: jest.fn(),
  },
}));

jest.mock('../../../components/RemarkDialog', () => 'MockRemarkDialog');
jest.mock('../../../components/VideoSelectionDialog', () => 'MockVideoSelectionDialog');
jest.mock('./../../globals.css', () => ({}));

// Mock Chrome APIs
const mockChromeStorage = {
  sync: {
    get: jest.fn(),
    set: jest.fn(),
  },
};

const mockChromeRuntime = {
  getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
  onMessage: {
    addListener: jest.fn(),
  },
  sendMessage: jest.fn(),
  lastError: null as any,
};

const mockChromeI18n = {
  getMessage: jest.fn((key: string, substitutions?: string | string[]) => {
    const translations: Record<string, string> = {
      'ok': 'OK',
      'yes': 'Yes',
      'no': 'No',
      'addRemark': 'Add Remark',
      'editRemark': 'Edit Remark',
      'downloadMedia': 'Download Media',
      'tweetIdError': 'Could not find tweet ID',
      'downloadError': 'Download Error',
      'noVideoFound': 'No video found',
      'unableToDownload': 'Unable to download: {0}',
      'tweetAlreadyDownloaded': 'Tweet already downloaded',
    };
    
    let message = translations[key] || key;
    if (substitutions) {
      const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
      subs.forEach((sub, index) => {
        message = message.replace(`{${index}}`, sub);
      });
    }
    return message;
  }),
};

Object.defineProperty(global, 'chrome', {
  value: {
    storage: mockChromeStorage,
    runtime: mockChromeRuntime,
    i18n: mockChromeI18n,
  },
  writable: true,
});

describe('TwitterEnhancer', () => {
  let mockMutationObserver: jest.MockedClass<typeof MutationObserver>;
  let originalGetInstance: any;

  beforeAll(() => {
    // Mock MutationObserver
    mockMutationObserver = jest.fn() as jest.MockedClass<typeof MutationObserver>;
    mockMutationObserver.prototype.observe = jest.fn();
    mockMutationObserver.prototype.disconnect = jest.fn();
    Object.defineProperty(global, 'MutationObserver', {
      value: mockMutationObserver,
      writable: true,
    });

    // Setup default storage response
    mockChromeStorage.sync.get.mockImplementation((_keys, callback) => {
      callback({
        userRemarks: [],
        remarkFeatureEnabled: true,
        videoDownloadFeatureEnabled: true,
      });
    });

    mockChromeStorage.sync.set.mockImplementation((_data, callback) => {
      if (callback) callback();
    });

    // Mock createRoot
    const mockCreateRoot = require('react-dom/client').createRoot;
    mockCreateRoot.mockReturnValue({
      render: jest.fn(),
    });

    // Mock React.createElement
    const mockReactCreateElement = React.createElement as jest.MockedFunction<typeof React.createElement>;
    mockReactCreateElement.mockReturnValue('MockComponent' as any);
  });

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear module cache to ensure fresh import
    jest.resetModules();

    // Reset storage mock
    mockChromeStorage.sync.get.mockImplementation((_keys, callback) => {
      callback({
        userRemarks: [],
        remarkFeatureEnabled: true,
        videoDownloadFeatureEnabled: true,
      });
    });
  });

  afterEach(() => {
    // Clean up any instances
    if (originalGetInstance) {
      originalGetInstance = null;
    }
  });

  describe('Basic Initialization', () => {
    it('should setup MutationObserver', async () => {
      // Import and trigger initialization
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockMutationObserver).toHaveBeenCalled();
      expect(mockMutationObserver.prototype.observe).toHaveBeenCalledWith(
        document.body,
        {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['src'],
        }
      );
    });

    it('should load settings from Chrome storage', async () => {
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockChromeStorage.sync.get).toHaveBeenCalledWith(
        ['userRemarks', 'remarkFeatureEnabled', 'videoDownloadFeatureEnabled'],
        expect.any(Function)
      );
    });

    it('should inject CSS styles', async () => {
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const linkElement = document.head.querySelector('link[rel="stylesheet"]');
      expect(linkElement).not.toBeNull();
      expect(linkElement?.getAttribute('href')).toBe('chrome-extension://test-id/content.css');
      expect(mockChromeRuntime.getURL).toHaveBeenCalledWith('content.css');
    });

    it('should setup event listeners', async () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
      expect(mockChromeRuntime.onMessage.addListener).toHaveBeenCalled();
    });
  });

  describe('Remark Functionality', () => {
    beforeEach(() => {
      // Setup DOM for remark testing
      document.body.innerHTML = `
        <div data-testid="User-Name">
          <a href="/testuser">
            <span>@testuser</span>
          </a>
        </div>
      `;
    });

    it('should add remark buttons when feature is enabled', async () => {
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const remarkButton = document.querySelector('.add-remark-btn');
      expect(remarkButton).not.toBeNull();
      expect(remarkButton?.textContent).toBe('Add Remark');
    });

    it('should not add remark buttons when feature is disabled', async () => {
      mockChromeStorage.sync.get.mockImplementation((_keys, callback) => {
        callback({
          userRemarks: [],
          remarkFeatureEnabled: false,
          videoDownloadFeatureEnabled: true,
        });
      });

      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const remarkButton = document.querySelector('.add-remark-btn');
      expect(remarkButton).toBeNull();
    });

    it('should update button text for existing remarks', async () => {
      mockChromeStorage.sync.get.mockImplementation((_keys, callback) => {
        callback({
          userRemarks: [{ username: 'testuser', remark: 'existing remark' }],
          remarkFeatureEnabled: true,
          videoDownloadFeatureEnabled: true,
        });
      });

      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const remarkButton = document.querySelector('.add-remark-btn');
      expect(remarkButton?.textContent).toBe('Edit Remark');
    });
  });

  describe('Video Download Functionality', () => {
    beforeEach(() => {
      // Setup DOM for video testing
      document.body.innerHTML = `
        <article data-testid="tweet">
          <div data-testid="videoComponent"></div>
          <div role="group"></div>
          <a href="/user/status/123456789">
            <time datetime="2023-01-01">Jan 1</time>
          </a>
        </article>
      `;
    });

    it('should add video download buttons when feature is enabled', async () => {
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const downloadButton = document.querySelector('.video-download-btn');
      expect(downloadButton).not.toBeNull();
      expect(downloadButton?.getAttribute('aria-label')).toBe('Download Media');
    });

    it('should not add video download buttons when feature is disabled', async () => {
      mockChromeStorage.sync.get.mockImplementation((_keys, callback) => {
        callback({
          userRemarks: [],
          remarkFeatureEnabled: true,
          videoDownloadFeatureEnabled: false,
        });
      });

      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const downloadButton = document.querySelector('.video-download-btn');
      expect(downloadButton).toBeNull();
    });

    it('should handle video download button clicks', async () => {
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const downloadButton = document.querySelector('.video-download-btn') as HTMLElement;
      downloadButton.click();
      
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        {
          action: 'getVideoInfo',
          tweetId: '123456789',
          currentDomain: 'localhost',
        },
        expect.any(Function)
      );
    });

    it('should handle successful video info response', async () => {
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const downloadButton = document.querySelector('.video-download-btn') as HTMLElement;
      downloadButton.click();
      
      // Simulate successful response
      const messageCallback = mockChromeRuntime.sendMessage.mock.calls[0][1];
      messageCallback({
        success: true,
        videoInfo: [{ videoUrl: 'http://example.com/video.mp4', quality: 'high', type: 'mp4' }],
      });
      
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        {
          action: 'downloadVideo',
          videoInfo: { videoUrl: 'http://example.com/video.mp4', quality: 'high', type: 'mp4' },
          tweetId: '123456789',
        },
        expect.any(Function)
      );
    });

    it('should show alert for download errors', async () => {
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const downloadButton = document.querySelector('.video-download-btn') as HTMLElement;
      downloadButton.click();
      
      // Simulate error response
      mockChromeRuntime.lastError = { message: 'Test error' };
      const messageCallback = mockChromeRuntime.sendMessage.mock.calls[0][1];
      messageCallback({ success: false, error: 'Test error' });
      
      const alertDialog = document.querySelector('.fixed.inset-0');
      expect(alertDialog).not.toBeNull();
      expect(alertDialog?.innerHTML).toContain('Download Error');
    });
  });

  describe('Settings Updates', () => {
    it('should handle settings update messages', async () => {
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Setup initial DOM with buttons
      document.body.innerHTML = `
        <div data-testid="User-Name" class="remark-button-added">
          <button class="add-remark-btn">Add Remark</button>
        </div>
        <article data-testid="tweet" class="video-download-added">
          <div class="video-download-btn"></div>
        </article>
      `;
      
      // Get the message listener
      const messageListener = mockChromeRuntime.onMessage.addListener.mock.calls[0][0];
      
      messageListener({
        action: 'updateSettings',
        remarkFeatureEnabled: false,
        videoDownloadFeatureEnabled: false,
      });
      
      // Should remove existing buttons when features are disabled
      expect(document.querySelector('.add-remark-btn')).toBeNull();
      expect(document.querySelector('.video-download-btn')).toBeNull();
    });
  });

  describe('Username Replacement', () => {
    it('should replace usernames with remarks', async () => {
      mockChromeStorage.sync.get.mockImplementation((_keys, callback) => {
        callback({
          userRemarks: [{ username: 'testuser', remark: 'Test Remark' }],
          remarkFeatureEnabled: true,
          videoDownloadFeatureEnabled: true,
        });
      });

      document.body.innerHTML = `
        <a href="/testuser">
          <span>testuser</span>
        </a>
      `;
      
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const userElement = document.querySelector('a[href="/testuser"] span') as HTMLElement;
      expect(userElement.textContent).toBe('Test Remark');
      
      const linkElement = document.querySelector('a[href="/testuser"]') as HTMLElement;
      expect(linkElement.getAttribute('title')).toBe('@testuser');
      expect(linkElement.classList.contains('username-replaced')).toBe(true);
    });
  });

  describe('Tweet ID Extraction', () => {
    it('should extract tweet ID from tweet element', async () => {
      document.body.innerHTML = `
        <article data-testid="tweet">
          <div data-testid="videoComponent"></div>
          <div role="group"></div>
          <a href="/user/status/123456789">
            <time datetime="2023-01-01">Jan 1</time>
          </a>
        </article>
      `;
      
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const downloadButton = document.querySelector('.video-download-btn') as HTMLElement;
      downloadButton.click();
      
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          tweetId: '123456789',
        }),
        expect.any(Function)
      );
    });

    it('should handle missing tweet ID', async () => {
      document.body.innerHTML = `
        <article data-testid="tweet">
          <div data-testid="videoComponent"></div>
          <div role="group"></div>
        </article>
      `;
      
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const downloadButton = document.querySelector('.video-download-btn') as HTMLElement;
      downloadButton.click();
      
      const alertDialog = document.querySelector('.fixed.inset-0');
      expect(alertDialog).not.toBeNull();
      expect(alertDialog?.innerHTML).toContain('Could not find tweet ID');
    });
  });

  describe('Dialog Functionality', () => {
    it('should show confirm dialog for already downloaded videos', async () => {
      // Reset chrome runtime lastError to null for this test
      mockChromeRuntime.lastError = null;
      
      document.body.innerHTML = `
        <article data-testid="tweet">
          <div data-testid="videoComponent"></div>
          <div role="group"></div>
          <a href="/user/status/123456789">
            <time datetime="2023-01-01">Jan 1</time>
          </a>
        </article>
      `;
      
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const downloadButton = document.querySelector('.video-download-btn') as HTMLElement;
      downloadButton.click();
      
      // Simulate already downloaded response
      const messageCallback = mockChromeRuntime.sendMessage.mock.calls[0][1];
      messageCallback({
        success: true,
        alreadyDownloaded: true,
        recordId: 'test-record-id',
      });
      
      const confirmDialog = document.querySelector('.fixed.inset-0');
      expect(confirmDialog).not.toBeNull();
      expect(confirmDialog?.innerHTML).toContain('Tweet already downloaded');
    });

    it('should handle multiple video selection', async () => {
      document.body.innerHTML = `
        <article data-testid="tweet">
          <div data-testid="videoComponent"></div>
          <div role="group"></div>
          <a href="/user/status/123456789">
            <time datetime="2023-01-01">Jan 1</time>
          </a>
        </article>
      `;
      
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const downloadButton = document.querySelector('.video-download-btn') as HTMLElement;
      downloadButton.click();
      
      // Simulate multiple videos response
      const messageCallback = mockChromeRuntime.sendMessage.mock.calls[0][1];
      messageCallback({
        success: true,
        videoInfo: [
          { videoUrl: 'http://example.com/video1.mp4', quality: 'high', type: 'mp4' },
          { videoUrl: 'http://example.com/video2.mp4', quality: 'low', type: 'mp4' },
        ],
      });
      
      // Should create video selection dialog
      const { createRoot } = require('react-dom/client');
      expect(createRoot).toHaveBeenCalled();
    });
  });

  describe('Analytics Logging', () => {
    it('should log video download clicks', async () => {
      const { Logger } = require('../../../utils/logger');
      
      document.body.innerHTML = `
        <article data-testid="tweet">
          <div data-testid="videoComponent"></div>
          <div role="group"></div>
          <a href="/user/status/123456789">
            <time datetime="2023-01-01">Jan 1</time>
          </a>
        </article>
      `;
      
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const downloadButton = document.querySelector('.video-download-btn') as HTMLElement;
      downloadButton.click();
      
      expect(Logger.logEvent).toHaveBeenCalledWith('video_download_click', {
        tweet_id: '123456789',
        domain: 'localhost',
      });
    });

    it('should log remark button clicks', async () => {
      const { Logger } = require('../../../utils/logger');
      
      document.body.innerHTML = `
        <div data-testid="User-Name">
          <a href="/testuser">
            <span>@testuser</span>
          </a>
        </div>
      `;
      
      require('../index');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const remarkButton = document.querySelector('.add-remark-btn') as HTMLElement;
      remarkButton.click();
      
      expect(Logger.logEvent).toHaveBeenCalledWith('click_remark_button', {
        username: 'testuser',
        remark: undefined,
      });
    });
  });
});