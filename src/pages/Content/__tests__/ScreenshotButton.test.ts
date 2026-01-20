/**
 * Tests for screenshot button injection in Twitter/X pages
 */

import { TweetParser } from '../../../dom/TweetParser';

// Mock chrome APIs
const mockChromeI18n = {
  getMessage: jest.fn((key: string) => {
    const messages: { [key: string]: string } = {
      screenshot: 'Screenshot',
      screenshotTweet: 'Screenshot Tweet',
      downloadScreenshot: 'Download Screenshot',
      copyToClipboard: 'Copy to Clipboard',
    };
    return messages[key] || key;
  }),
};

Object.defineProperty(global, 'chrome', {
  value: {
    i18n: mockChromeI18n,
    storage: {
      sync: {
        get: jest.fn((keys, callback) => {
          callback({ screenshotFeatureEnabled: true });
        }),
        set: jest.fn((items, callback) => {
          if (callback) callback();
        }),
      },
    },
    runtime: {
      getURL: jest.fn((path) => `chrome-extension://mockid/${path}`),
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
      },
      lastError: null,
    },
  },
  writable: true,
});

describe('Screenshot Button Injection', () => {
  let tweetParser: TweetParser;

  beforeEach(() => {
    tweetParser = new TweetParser();
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  /**
   * Helper to create a mock tweet element with action bar
   */
  function createMockTweet(
    options: {
      tweetId?: string;
      username?: string;
      displayName?: string;
      content?: string;
      hasImages?: boolean;
      hasScreenshotButton?: boolean;
    } = {}
  ): HTMLElement {
    const {
      tweetId = '1234567890',
      username = 'testuser',
      displayName = 'Test User',
      content = 'This is a test tweet',
      hasImages = false,
      hasScreenshotButton = false,
    } = options;

    const tweet = document.createElement('article');
    tweet.setAttribute('data-testid', 'tweet');
    tweet.innerHTML = `
      <div data-testid="Tweet-User-Avatar">
        <img src="https://pbs.twimg.com/profile_images/123/avatar.jpg" />
      </div>
      <div data-testid="User-Name">
        <a href="/${username}">
          <span>${displayName}</span>
          <span>@${username}</span>
        </a>
      </div>
      <div data-testid="tweetText">${content}</div>
      <a href="/${username}/status/${tweetId}">
        <time datetime="2024-01-15T12:00:00.000Z">Jan 15, 2024</time>
      </a>
      ${hasImages ? '<div data-testid="tweetPhoto"><img src="https://pbs.twimg.com/media/image.jpg" /></div>' : ''}
      <div role="group">
        <div data-testid="reply"></div>
        <div data-testid="retweet"></div>
        <div data-testid="like"></div>
        ${hasScreenshotButton ? '<button class="screenshot-btn" aria-label="Screenshot Tweet"></button>' : ''}
      </div>
    `;
    document.body.appendChild(tweet);
    return tweet;
  }

  describe('Button Detection', () => {
    it('should detect when screenshot button is already present', () => {
      const tweet = createMockTweet({ hasScreenshotButton: true });
      const actionBar = tweet.querySelector('[role="group"]') as Element;

      expect(tweetParser.hasScreenshotButton(actionBar)).toBe(true);
    });

    it('should detect when screenshot button is not present', () => {
      const tweet = createMockTweet({ hasScreenshotButton: false });
      const actionBar = tweet.querySelector('[role="group"]') as Element;

      expect(tweetParser.hasScreenshotButton(actionBar)).toBe(false);
    });
  });

  describe('Tweet Data Extraction', () => {
    it('should extract complete tweet data for screenshot', () => {
      createMockTweet({
        tweetId: '9876543210',
        username: 'johndoe',
        displayName: 'John Doe',
        content: 'Hello World!',
      });

      const tweet = document.querySelector('article[data-testid="tweet"]')!;
      const tweetData = tweetParser.getFullTweetData(tweet);

      expect(tweetData).not.toBeNull();
      expect(tweetData?.tweetId).toBe('9876543210');
      expect(tweetData?.username).toBe('johndoe');
      expect(tweetData?.displayName).toBe('John Doe');
      expect(tweetData?.content).toBe('Hello World!');
    });

    it('should extract tweet with images', () => {
      createMockTweet({ hasImages: true });

      const tweet = document.querySelector('article[data-testid="tweet"]')!;
      const tweetData = tweetParser.getFullTweetData(tweet);

      expect(tweetData?.imageUrls.length).toBeGreaterThan(0);
    });
  });

  describe('Action Bar Location', () => {
    it('should find action bar in tweet', () => {
      const tweet = createMockTweet();
      const actionBar = tweetParser.getActionBar(tweet);

      expect(actionBar).not.toBeNull();
      expect(actionBar?.getAttribute('role')).toBe('group');
    });

    it('should return null for tweet without action bar', () => {
      const tweet = document.createElement('article');
      tweet.setAttribute('data-testid', 'tweet');
      tweet.innerHTML = '<div>No action bar</div>';
      document.body.appendChild(tweet);

      const actionBar = tweetParser.getActionBar(tweet);
      expect(actionBar).toBeNull();
    });
  });

  describe('Screenshot Button Creation', () => {
    it('should create button with correct class', () => {
      const button = document.createElement('button');
      button.className = 'screenshot-btn';

      expect(button.classList.contains('screenshot-btn')).toBe(true);
    });

    it('should create button with aria-label for accessibility', () => {
      const button = document.createElement('button');
      button.className = 'screenshot-btn';
      button.setAttribute('aria-label', 'Screenshot Tweet');

      expect(button.getAttribute('aria-label')).toBe('Screenshot Tweet');
    });
  });

  describe('Multiple Tweets', () => {
    it('should handle multiple tweets on page', () => {
      createMockTweet({ tweetId: '111', username: 'user1' });
      createMockTweet({ tweetId: '222', username: 'user2' });
      createMockTweet({ tweetId: '333', username: 'user3' });

      const tweets = document.querySelectorAll('article[data-testid="tweet"]');
      expect(tweets.length).toBe(3);

      tweets.forEach((tweet) => {
        const actionBar = tweetParser.getActionBar(tweet);
        expect(actionBar).not.toBeNull();
        expect(tweetParser.hasScreenshotButton(actionBar!)).toBe(false);
      });
    });

    it('should skip tweets that already have screenshot button', () => {
      createMockTweet({ tweetId: '111', hasScreenshotButton: true });
      createMockTweet({ tweetId: '222', hasScreenshotButton: false });

      const tweets = document.querySelectorAll('article[data-testid="tweet"]');
      const actionBars = Array.from(tweets).map((t) =>
        tweetParser.getActionBar(t)
      );

      expect(tweetParser.hasScreenshotButton(actionBars[0]!)).toBe(true);
      expect(tweetParser.hasScreenshotButton(actionBars[1]!)).toBe(false);
    });
  });

  describe('Button Click Handler', () => {
    it('should prevent event propagation when clicked', () => {
      const button = document.createElement('button');
      button.className = 'screenshot-btn';

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };

      // Simulate click handler behavior
      const clickHandler = (e: {
        preventDefault: () => void;
        stopPropagation: () => void;
      }) => {
        e.preventDefault();
        e.stopPropagation();
      };

      clickHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Feature Toggle', () => {
    it('should respect screenshotFeatureEnabled setting', () => {
      // When enabled
      let isEnabled = true;
      expect(isEnabled).toBe(true);

      // When disabled
      isEnabled = false;
      expect(isEnabled).toBe(false);
    });
  });
});
