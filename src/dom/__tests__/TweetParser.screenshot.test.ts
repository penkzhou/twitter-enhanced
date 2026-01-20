import { TweetParser } from '../TweetParser';

describe('TweetParser - Screenshot Features', () => {
  let tweetParser: TweetParser;

  beforeEach(() => {
    tweetParser = new TweetParser();
    document.body.innerHTML = '';
  });

  describe('getAvatarUrl', () => {
    it('should extract avatar URL from tweet element', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <div data-testid="Tweet-User-Avatar">
          <img src="https://pbs.twimg.com/profile_images/123/avatar_normal.jpg" alt="Avatar" />
        </div>
      `;

      const avatarUrl = tweetParser.getAvatarUrl(tweetElement);
      expect(avatarUrl).toBe(
        'https://pbs.twimg.com/profile_images/123/avatar_normal.jpg'
      );
    });

    it('should return higher resolution avatar URL when available', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <div data-testid="Tweet-User-Avatar">
          <img src="https://pbs.twimg.com/profile_images/123/avatar_normal.jpg" alt="Avatar" />
        </div>
      `;

      const avatarUrl = tweetParser.getAvatarUrl(tweetElement);
      // Should return the URL as-is, caller can modify for higher resolution
      expect(avatarUrl).toContain('pbs.twimg.com/profile_images');
    });

    it('should return null when no avatar found', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = '<div>No avatar</div>';

      const avatarUrl = tweetParser.getAvatarUrl(tweetElement);
      expect(avatarUrl).toBeNull();
    });

    it('should handle avatar in nested structure', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <div>
          <div>
            <a href="/testuser">
              <div data-testid="Tweet-User-Avatar">
                <div>
                  <img src="https://pbs.twimg.com/profile_images/456/avatar.jpg" />
                </div>
              </div>
            </a>
          </div>
        </div>
      `;

      const avatarUrl = tweetParser.getAvatarUrl(tweetElement);
      expect(avatarUrl).toBe(
        'https://pbs.twimg.com/profile_images/456/avatar.jpg'
      );
    });
  });

  describe('isVerified', () => {
    it('should return true for verified user with blue checkmark', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <div data-testid="User-Name">
          <span>Test User</span>
          <svg data-testid="icon-verified"></svg>
          <span>@testuser</span>
        </div>
      `;

      expect(tweetParser.isVerified(tweetElement)).toBe(true);
    });

    it('should return true for verified user with verificationBadge', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <div data-testid="User-Name">
          <span>Test User</span>
          <div data-testid="verificationBadge"></div>
          <span>@testuser</span>
        </div>
      `;

      expect(tweetParser.isVerified(tweetElement)).toBe(true);
    });

    it('should return false for non-verified user', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <div data-testid="User-Name">
          <span>Test User</span>
          <span>@testuser</span>
        </div>
      `;

      expect(tweetParser.isVerified(tweetElement)).toBe(false);
    });
  });

  describe('getImageUrls', () => {
    it('should extract image URLs from tweet with single image', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <div data-testid="tweetPhoto">
          <img src="https://pbs.twimg.com/media/abc123?format=jpg&name=medium" />
        </div>
      `;

      const imageUrls = tweetParser.getImageUrls(tweetElement);
      expect(imageUrls).toHaveLength(1);
      expect(imageUrls[0]).toContain('pbs.twimg.com/media');
    });

    it('should extract multiple image URLs from tweet', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <div data-testid="tweetPhoto">
          <img src="https://pbs.twimg.com/media/img1?format=jpg" />
        </div>
        <div data-testid="tweetPhoto">
          <img src="https://pbs.twimg.com/media/img2?format=jpg" />
        </div>
        <div data-testid="tweetPhoto">
          <img src="https://pbs.twimg.com/media/img3?format=jpg" />
        </div>
      `;

      const imageUrls = tweetParser.getImageUrls(tweetElement);
      expect(imageUrls).toHaveLength(3);
    });

    it('should return empty array when no images found', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = '<div>Text only tweet</div>';

      const imageUrls = tweetParser.getImageUrls(tweetElement);
      expect(imageUrls).toHaveLength(0);
    });

    it('should filter out avatar images', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <div data-testid="Tweet-User-Avatar">
          <img src="https://pbs.twimg.com/profile_images/avatar.jpg" />
        </div>
        <div data-testid="tweetPhoto">
          <img src="https://pbs.twimg.com/media/content.jpg" />
        </div>
      `;

      const imageUrls = tweetParser.getImageUrls(tweetElement);
      expect(imageUrls).toHaveLength(1);
      expect(imageUrls[0]).toContain('media/content.jpg');
    });
  });

  describe('getTweetUrl', () => {
    it('should construct tweet URL from tweet element', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <a href="/testuser/status/1234567890">
          <time datetime="2024-01-15T12:00:00.000Z">Jan 15</time>
        </a>
      `;

      const tweetUrl = tweetParser.getTweetUrl(tweetElement);
      expect(tweetUrl).toBe('https://twitter.com/testuser/status/1234567890');
    });

    it('should return null when no status link found', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = '<div>No link</div>';

      const tweetUrl = tweetParser.getTweetUrl(tweetElement);
      expect(tweetUrl).toBeNull();
    });
  });

  describe('getTimestampInfo', () => {
    it('should extract timestamp display text and datetime', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = `
        <time datetime="2024-01-15T12:00:00.000Z">Jan 15, 2024</time>
      `;

      const timestampInfo = tweetParser.getTimestampInfo(tweetElement);
      expect(timestampInfo).toEqual({
        displayText: 'Jan 15, 2024',
        datetime: '2024-01-15T12:00:00.000Z',
      });
    });

    it('should return null values when no timestamp found', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = '<div>No time</div>';

      const timestampInfo = tweetParser.getTimestampInfo(tweetElement);
      expect(timestampInfo).toEqual({
        displayText: null,
        datetime: null,
      });
    });
  });

  describe('getFullTweetData', () => {
    it('should extract complete tweet data for screenshot', () => {
      const tweetElement = document.createElement('article');
      tweetElement.setAttribute('data-testid', 'tweet');
      tweetElement.innerHTML = `
        <div data-testid="Tweet-User-Avatar">
          <img src="https://pbs.twimg.com/profile_images/123/avatar.jpg" />
        </div>
        <div data-testid="User-Name">
          <a href="/johndoe">
            <span>John Doe</span>
            <svg data-testid="icon-verified"></svg>
            <span>@johndoe</span>
          </a>
        </div>
        <div data-testid="tweetText">Hello, this is my tweet! #test</div>
        <a href="/johndoe/status/9876543210">
          <time datetime="2024-01-15T12:00:00.000Z">Jan 15, 2024</time>
        </a>
        <div data-testid="tweetPhoto">
          <img src="https://pbs.twimg.com/media/photo1.jpg" />
        </div>
      `;

      const tweetData = tweetParser.getFullTweetData(tweetElement);

      expect(tweetData).not.toBeNull();
      expect(tweetData?.tweetId).toBe('9876543210');
      expect(tweetData?.displayName).toBe('John Doe');
      expect(tweetData?.username).toBe('johndoe');
      expect(tweetData?.avatarUrl).toBe(
        'https://pbs.twimg.com/profile_images/123/avatar.jpg'
      );
      expect(tweetData?.content).toBe('Hello, this is my tweet! #test');
      expect(tweetData?.timestamp).toBe('Jan 15, 2024');
      expect(tweetData?.datetime).toBe('2024-01-15T12:00:00.000Z');
      expect(tweetData?.isVerified).toBe(true);
      expect(tweetData?.imageUrls).toHaveLength(1);
      expect(tweetData?.tweetUrl).toBe(
        'https://twitter.com/johndoe/status/9876543210'
      );
    });

    it('should return null when essential data is missing', () => {
      const tweetElement = document.createElement('article');
      tweetElement.innerHTML = '<div>Incomplete tweet</div>';

      const tweetData = tweetParser.getFullTweetData(tweetElement);
      expect(tweetData).toBeNull();
    });

    it('should handle tweet without images', () => {
      const tweetElement = document.createElement('article');
      tweetElement.setAttribute('data-testid', 'tweet');
      tweetElement.innerHTML = `
        <div data-testid="Tweet-User-Avatar">
          <img src="https://pbs.twimg.com/profile_images/123/avatar.jpg" />
        </div>
        <div data-testid="User-Name">
          <a href="/testuser">
            <span>Test User</span>
            <span>@testuser</span>
          </a>
        </div>
        <div data-testid="tweetText">Just a text tweet</div>
        <a href="/testuser/status/1111111111">
          <time datetime="2024-02-20T10:30:00.000Z">Feb 20</time>
        </a>
      `;

      const tweetData = tweetParser.getFullTweetData(tweetElement);

      expect(tweetData).not.toBeNull();
      expect(tweetData?.imageUrls).toHaveLength(0);
      expect(tweetData?.isVerified).toBe(false);
    });

    it('should detect retweet status', () => {
      const tweetElement = document.createElement('article');
      tweetElement.setAttribute('data-testid', 'tweet');
      tweetElement.innerHTML = `
        <div data-testid="socialContext">Retweeted by Someone</div>
        <div data-testid="Tweet-User-Avatar">
          <img src="https://pbs.twimg.com/profile_images/123/avatar.jpg" />
        </div>
        <div data-testid="User-Name">
          <a href="/original">
            <span>Original Author</span>
            <span>@original</span>
          </a>
        </div>
        <div data-testid="tweetText">Retweeted content</div>
        <a href="/original/status/2222222222">
          <time datetime="2024-03-01T08:00:00.000Z">Mar 1</time>
        </a>
      `;

      const tweetData = tweetParser.getFullTweetData(tweetElement);

      expect(tweetData).not.toBeNull();
      expect(tweetData?.isRetweet).toBe(true);
    });
  });

  describe('hasScreenshotButton', () => {
    it('should return true when action bar has screenshot button', () => {
      const actionBar = document.createElement('div');
      actionBar.innerHTML = `
        <button class="screenshot-btn">Screenshot</button>
      `;

      expect(tweetParser.hasScreenshotButton(actionBar)).toBe(true);
    });

    it('should return false when action bar has no screenshot button', () => {
      const actionBar = document.createElement('div');
      actionBar.innerHTML = '<button>Other button</button>';

      expect(tweetParser.hasScreenshotButton(actionBar)).toBe(false);
    });
  });
});
