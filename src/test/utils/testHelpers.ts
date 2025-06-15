import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

// Mock Chrome storage data
export const mockChromeStorage = {
  sync: {
    userRemarks: [
      { username: 'testuser1', remark: 'Test remark 1' },
      { username: 'testuser2', remark: 'Test remark 2' },
    ],
    remarkFeatureEnabled: true,
    videoDownloadFeatureEnabled: true,
    downloadDirectory: '/Users/test/Downloads',
  },
  local: {
    analyticsClientId: 'test-client-id',
  },
  session: {
    analyticsSessionId: 'test-session-id',
  },
};

// Helper to setup Chrome storage mocks
export const setupChromeStorageMock = (data: any = mockChromeStorage) => {
  (chrome.storage.sync.get as jest.Mock).mockImplementation((keys, callback) => {
    if (typeof keys === 'function') {
      callback = keys;
      keys = null;
    }
    
    if (keys === null) {
      callback(data.sync);
    } else if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => {
        if (data.sync[key] !== undefined) {
          (result as any)[key] = data.sync[key];
        }
      });
      callback(result);
    } else if (typeof keys === 'string') {
      callback({ [keys]: data.sync[keys] });
    } else if (typeof keys === 'object') {
      const result = {};
      Object.keys(keys).forEach(key => {
        (result as any)[key] = data.sync[key] !== undefined ? data.sync[key] : (keys as any)[key];
      });
      callback(result);
    }
  });

  (chrome.storage.sync.set as jest.Mock).mockImplementation((items, callback) => {
    Object.assign(data.sync, items);
    if (callback) callback();
  });
};

// Helper to create mock Twitter DOM elements
export const createMockTweetElement = (options: {
  username?: string;
  hasVideo?: boolean;
  videoCount?: number;
  tweetId?: string;
} = {}) => {
  const {
    username = 'testuser',
    hasVideo = false,
    videoCount = 1,
    tweetId = '123456789',
  } = options;

  const tweetElement = document.createElement('article');
  tweetElement.setAttribute('data-testid', 'tweet');
  tweetElement.setAttribute('data-tweet-id', tweetId);

  // Add username element
  const usernameElement = document.createElement('span');
  usernameElement.textContent = `@${username}`;
  usernameElement.setAttribute('data-testid', 'username');
  tweetElement.appendChild(usernameElement);

  // Add video elements if requested
  if (hasVideo) {
    for (let i = 0; i < videoCount; i++) {
      const videoElement = document.createElement('video');
      videoElement.setAttribute('data-testid', 'video');
      videoElement.src = `https://video.twimg.com/test-video-${i}.mp4`;
      tweetElement.appendChild(videoElement);
    }
  }

  return tweetElement;
};

// Helper to simulate Chrome runtime messages
export const simulateRuntimeMessage = (
  message: any,
  sender: chrome.runtime.MessageSender = {},
  sendResponse: (response?: any) => void = jest.fn()
) => {
  const listeners = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls;
  const lastListener = listeners[listeners.length - 1];
  
  if (lastListener && lastListener[0]) {
    return lastListener[0](message, sender, sendResponse);
  }
  
  return false;
};

// Helper to create mock download records
interface MockDownloadRecord {
  id: number;
  tweetId: string;
  filename: string;
  downloadDate: string;
  downloadId: number;
  tweetUrl: string;
  tweetText: string;
}

export const createMockDownloadRecord = (overrides: Partial<MockDownloadRecord> = {}): MockDownloadRecord => ({
  id: 123,
  tweetId: '123456789',
  filename: 'test-video.mp4',
  downloadDate: new Date().toISOString(),
  downloadId: 456,
  tweetUrl: 'https://twitter.com/user/status/123456789',
  tweetText: 'Test tweet content',
  ...overrides,
});

// Custom render function with providers
const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return children as ReactElement;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Wait helpers for async operations
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};

// Mock IndexedDB operations
export const mockIndexedDB = {
  databases: new Map(),
  
  setup: () => {
    // FakeIndexedDB is already set up in setup.ts
    // This is just for additional mocking if needed
  },
  
  clear: () => {
    // Clear all fake databases
    mockIndexedDB.databases.clear();
  },
};